import { cleanEnv, str, url, num, port } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),
  DATABASE_URL: url(),
  REDIS_URL: url({ default: 'redis://localhost:6379' }),
  GITHUB_APP_ID: str(),
  GITHUB_APP_PRIVATE_KEY_PATH: str(),
  GITHUB_WEBHOOK_SECRET: str(),
  OPENAI_API_KEY: str(),
  ANTHROPIC_API_KEY: str(),
  GOOGLE_GENERATIVE_AI_API_KEY: str(),
  DEFAULT_MODEL_PROVIDER: str({ default: 'openai' }),
  DEFAULT_MODEL: str({ default: 'gpt-4o' }),
  MAX_CONCURRENT_RUNS: num({ default: 4 }),
  LOG_LEVEL: str({ choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'], default: 'info' }),
});
