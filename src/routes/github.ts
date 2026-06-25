import { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";

export const githubPlugin: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/github", async (req, reply) => {
    const body = req.body as {
      action?: string;
      installation?: { id: number };
      repository?: { full_name: string };
    };
    if (!body?.installation?.id || !body?.repository?.full_name) {
      return reply.status(400).send({ error: "invalid_webhook" });
    }

    const [owner, name] = body.repository.full_name.split("/");
    const repo = await prisma.repository.upsert({
      where: { url: `https://github.com/${body.repository.full_name}` },
      create: {
        owner,
        name,
        url: `https://github.com/${body.repository.full_name}`,
      },
      update: {},
    });

    return { accepted: true, repositoryId: repo.id, action: body.action };
  });
};
