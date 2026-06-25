import { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";
import { env } from "../config/env";

export const rootPlugin: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    ok: true,
    env: env.NODE_ENV,
  }));

  app.get("/repos", async () => {
    return prisma.repository.findMany({
      orderBy: { updatedAt: "desc" },
    });
  });

  app.post("/repos", async (req, reply) => {
    const { owner, name, url, branch } = req.body as { owner: string; name: string; url: string; branch?: string };
    if (!owner || !name || !url) {
      return reply.status(400).send({ error: "owner, name, and url are required" });
    }
    const repo = await prisma.repository.create({
      data: { owner, name, url, branch: branch || "main" },
    });
    return reply.status(201).send(repo);
  });

  app.get("/repos/:repoId/runs", async (req) => {
    const repoId = (req.params as { repoId: string }).repoId;
    return prisma.run.findMany({
      where: { repositoryId: repoId },
      orderBy: { startedAt: "desc" },
      take: 50,
    });
  });

  app.get("/runs", async () => {
    return prisma.run.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });
  });

  app.get("/findings", async () => {
    return prisma.finding.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });
};