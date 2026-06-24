import { createApp } from './server';
import { env } from './config/env';
import { connectDatabase } from './db';

const app = createApp();

async function start() {
  try {
    await connectDatabase();
    app.listen({ port: env.PORT as number }, () => {
      app.log.info(`CodePulse listening on :${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
