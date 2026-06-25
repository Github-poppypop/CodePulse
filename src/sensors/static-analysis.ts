import { execa } from "execa";
import { SensorReading } from "./types";

export async function analyzeRepository(
  repositoryId: string,
  repoPath: string,
): Promise<SensorReading[]> {
  const readings: SensorReading[] = [];
  const baseTime = new Date();

  const commands: Array<{
    cmd: string;
    source: SensorReading["source"];
    category: string;
  }> = [
    {
      cmd: "npm run lint --silent 2>&1 || true",
      source: "static_analysis",
      category: "lint",
    },
    {
      cmd: "npx tsc --noEmit 2>&1 || true",
      source: "static_analysis",
      category: "types",
    },
    {
      cmd: "git status --short 2>&1 || true",
      source: "git_history",
      category: "status",
    },
  ];

  for (const { cmd, source, category } of commands) {
    try {
      const { stdout } = await execa(cmd, { cwd: repoPath, shell: true });
      const text = stdout?.trim() || "";
      if (text) {
        readings.push({
          id: `${source}-${category}-${Date.now()}`,
          repositoryId,
          source,
          category,
          severity: "warn",
          detail: text.slice(0, 2000),
          raw: { text },
          detectedAt: baseTime,
        });
      }
    } catch (error) {
      readings.push({
        id: `${source}-${category}-error-${Date.now()}`,
        repositoryId,
        source,
        category,
        severity: "error",
        detail: (error as Error).message,
        raw: { error: true },
        detectedAt: baseTime,
      });
    }
  }

  return readings;
}
