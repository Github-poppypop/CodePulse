import fastify from 'fastify';
import { rootPlugin } from './routes/root';
import { githubPlugin } from './routes/github';
import { env } from './config/env';

export function createApp() {
  const app = fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty' }
          : undefined,
    },
  });

  app.register(rootPlugin);
  app.register(githubPlugin);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error, 'Unhandled application error');
    reply.status(500).send({ error: 'internal_error' });
  });

  return app;
}
