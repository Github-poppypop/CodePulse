import { cleanEnv, str, port } from "envalid";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  PORT: port({ default: 3005 }),
  DATABASE_URL: str({ default: "file:./dev.db" }),
  OPENROUTER_API_KEY: str({ default: "" }),
  ANTHROPIC_API_KEY: str({ default: "" }),
  OPENAI_API_KEY: str({ default: "" }),
  LOCAL_LLM_BASE_URL: str({ default: "http://localhost:11434/v1" }),
  GITHUB_TOKEN: str({ default: "" }),
  GITHUB_WEBHOOK_SECRET: str({ default: "" }),
  REDIS_URL: str({ default: "" }),
  LOG_LEVEL: str({
    choices: ["fatal", "error", "warn", "info", "debug", "trace"],
    default: "info",
  }),
});
