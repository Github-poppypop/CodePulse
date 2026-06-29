import { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";

export const apiPlugin: FastifyPluginAsync = async (app) => {
  // === ORGANIZATIONS ===
  app.get("/api/organizations", async () => {
    const orgs = await prisma.organization.findMany({
      include: { members: true, _count: { select: { repositories: true } } },
    });
    return orgs;
  });

  app.post("/api/organizations", async (request, reply) => {
    const { name, slug } = request.body as { name: string; slug: string };
    const org = await prisma.organization.create({
      data: { name, slug },
    });
    return reply.status(201).send(org);
  });

  // === MEMBERS ===
  app.get("/api/organizations/:orgId/members", async (request) => {
    const { orgId } = request.params as { orgId: string };
    return prisma.member.findMany({ where: { organizationId: orgId } });
  });

  app.post("/api/organizations/:orgId/members/invite", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const { email, role } = request.body as { email: string; role: string };
    const member = await prisma.member.create({
      data: { organizationId: orgId, email, role, userId: email, status: "PENDING" },
    });
    return reply.status(201).send(member);
  });

  // === GITHUB APP ===
  app.get("/api/github-app/install", async (request) => {
    const { orgId } = request.query as { orgId?: string };
    return {
      appName: "codepulse-bot",
      permissions: {
        contents: "read",
        pull_requests: "write",
        metadata: "read",
        checks: "write",
        issues: "write",
      },
      installUrl: `https://github.com/apps/codepulse-bot/installations/new?state=${orgId || "default"}`,
    };
  });

  // === PULL REQUESTS ===
  app.post("/api/runs/:runId/prs", async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const { title, branch } = request.body as { title: string; branch: string };
    const fix = await prisma.fix.create({
      data: { runId, findingId: "pending", status: "PENDING_PR", description: title, diff: branch },
    });
    return reply.status(201).send(fix);
  });

  // === ISSUE SYNC ===
  app.get("/api/findings/:findingId/issue", async (request) => {
    const { findingId } = request.params as { findingId: string };
    return prisma.finding.findUnique({ where: { id: findingId }, select: { githubIssueNumber: true, githubIssueUrl: true } });
  });

  app.post("/api/findings/:findingId/issue", async (request, reply) => {
    const { findingId } = request.params as { findingId: string };
    const { createIssue } = request.body as { createIssue: boolean };
    if (!createIssue) return reply.status(400).send({ error: "Must set createIssue=true" });
    const issueNum = Math.floor(Math.random() * 9999) + 1;
    const issueUrl = `https://github.com/org/repo/issues/${issueNum}`;
    const updated = await prisma.finding.update({
      where: { id: findingId },
      data: { githubIssueNumber: issueNum, githubIssueUrl: issueUrl },
    });
    return reply.send(updated);
  });

  // === SCHEDULES ===
  app.get("/api/schedules", async () => {
    return prisma.schedule.findMany({ include: { repository: true } });
  });

  app.post("/api/schedules", async (request, reply) => {
    const { repositoryId, cron, trigger } = request.body as { repositoryId: string; cron: string; trigger: string };
    const schedule = await prisma.schedule.create({
      data: { repositoryId, cron, trigger, enabled: true },
    });
    return reply.status(201).send(schedule);
  });

  // === SECRETS DETECTION ===
  app.get("/api/runs/:runId/secrets", async (request) => {
    const { runId } = request.params as { runId: string };
    return prisma.finding.findMany({
      where: { runId, category: "SECRETS" },
      orderBy: { severity: "desc" },
    });
  });

  // === DEPENDENCIES ===
  app.get("/api/dependencies", async () => {
    return prisma.dependency.findMany({ include: { repository: true }, orderBy: { severity: "desc" } });
  });

  // === COST ===
  app.get("/api/costs", async () => {
    const events = await prisma.telemetryEvent.findMany();
    const byProvider: Record<string, { tokens: number; cost: number }> = {};
    for (const e of events) {
      if (!byProvider[e.provider]) byProvider[e.provider] = { tokens: 0, cost: 0 };
      byProvider[e.provider].tokens += e.tokenCount;
      byProvider[e.provider].cost += e.cost;
    }
    return byProvider;
  });

  // === DEDUPLICATION ===
  app.get("/api/findings/duplicates", async () => {
    const findings = await prisma.finding.findMany();
    const seen: Record<string, number> = {};
    for (const f of findings) {
      const key = `${f.category}-${f.severity}-${f.title}`;
      seen[key] = (seen[key] || 0) + 1;
    }
    return Object.entries(seen).filter(([, count]) => count > 1).map(([key, count]) => ({ key, count }));
  });

  // === ROLLBACK ===
  app.post("/api/fixes/:fixId/rollback", async (request, reply) => {
    const { fixId } = request.params as { fixId: string };
    const fix = await prisma.fix.update({
      where: { id: fixId },
      data: { status: "ROLLED_BACK" },
    });
    return reply.send(fix);
  });

  // === AUDIT EXPORT ===
  app.get("/api/audit/export", async (_request, reply) => {
    const events = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
    reply.header("Content-Type", "application/json");
    return reply.send({ events, exportedAt: new Date().toISOString() });
  });

  // === BENCHMARKS ===
  app.get("/api/benchmarks", async () => {
    return prisma.benchmark.findMany({ include: { suite: true }, orderBy: { score: "desc" } });
  });

  // === RUNNERS ===
  app.get("/api/runners", async () => {
    return prisma.runner.findMany({ orderBy: { createdAt: "desc" } });
  });

  app.post("/api/runners", async (request, reply) => {
    const { name, provider, type } = request.body as { name: string; provider: string; type: string };
    const runner = await prisma.runner.create({
      data: { name, provider, type, status: "IDLE" },
    });
    return reply.status(201).send(runner);
  });

  // === NOTIFICATIONS ===
  app.get("/api/notifications/settings", async () => {
    return prisma.notificationSettings.findMany();
  });

  app.put("/api/notifications/settings", async (request, reply) => {
    const settings = request.body as { id?: string; userId?: string; orgId?: string; channel?: string; webhookUrl?: string; digestMode?: string; eventTypes?: string; enabled?: boolean };
    const updated = await prisma.notificationSettings.upsert({
      where: { id: settings.id || "default" },
      create: settings,
      update: settings,
    });
    return reply.send(updated);
  });
};
