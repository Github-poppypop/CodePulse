import fastify from "fastify";
import cors from "@fastify/cors";
import { rootPlugin } from "./routes/root";
import { githubPlugin } from "./routes/github";
import { apiPlugin } from "./routes/api";
import { env } from "./config/env";

export function createApp() {
  const app = fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  });

  app.register(cors, { origin: true });
  app.register(rootPlugin);
  app.register(githubPlugin);
  app.register(apiPlugin);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error, "Unhandled application error");
    reply.status(500).send({ error: "internal_error" });
  });

  return app;
}
