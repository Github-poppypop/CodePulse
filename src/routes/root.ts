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
      include: { installations: true },
    });
  });

  app.get("/repos/:repoId/runs", async (req) => {
    const repoId = (req.params as { repoId: string }).repoId;
    return prisma.agentRun.findMany({
      where: { repositoryId: repoId },
      orderBy: { startedAt: "desc" },
      take: 50,
    });
  });
};
