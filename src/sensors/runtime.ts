import { execa } from 'execa';
import { SensorReading, Severity, SourceType } from './types';

export interface RuntimeSensorOptions {
  repoPath: string;
  repositoryId: string;
  runId?: string;
  maxOutputLength?: number;
  detectedAt?: Date;
}

export interface RuntimeMetricsPayload {
  category: string;
  severity: Severity;
  detail: string;
  raw: Record<string, unknown>;
}

export async function collectRuntimeMetrics(
  options: RuntimeSensorOptions
): Promise<RuntimeMetricsPayload[]> {
  const detectedAt = options.detectedAt ?? new Date();
  const maxLength = options.maxOutputLength ?? 2000;
  const repoPath = options.repoPath;

  const commands: Array<{ label: string; cmd: string; category: string }> = [
    { label: 'npm run lint', cmd: 'npm run lint', category: 'lint' },
    { label: 'tsc --noEmit', cmd: 'npx tsc --noEmit', category: 'types' },
    {
      label: 'npm run test',
      cmd: 'npm run test --silent 2>&1 || true',
      category: 'tests',
    },
  ];

  return Promise.all(
    commands.map(async ({ label, cmd, category }) => {
      try {
        const { stdout, stderr } = await execa(cmd, {
          cwd: repoPath,
          shell: true,
          timeout: 120_000,
          stdio: 'pipe',
        });

        const combined = [stdout, stderr].filter(Boolean).join('\n').trim();
        const summary = combined.length > maxLength
          ? `${combined.slice(0, maxLength)}\n...[truncated]`
          : combined;
        const hasError = /error\b/i.test(combined);

        return {
          category,
          severity: hasError ? ('error' as Severity) : ('info' as Severity),
          detail: summary || `No output from ${label}.`,
          raw: {
            label,
            cmd,
            hasError,
            exitSignal: 'exit',
            output: combined,
          },
        } satisfies RuntimeMetricsPayload;
      } catch (error) {
        const message = (error as Error).message ?? String(error);
        const output = message.length > maxLength
          ? `${message.slice(0, maxLength)}\n...[truncated]`
          : message;
        const hasError = /error|failed/i.test(message);

        return {
          category,
          severity: hasError ? ('error' as Severity) : ('warn' as Severity),
          detail: `${label} failed: ${output}`,
          raw: {
            label,
            cmd,
            hasError: true,
            exitSignal: 'exception',
            output,
          },
        } satisfies RuntimeMetricsPayload;
      }
    })
  );
}

export async function analyzeRepositoryRuntime(
  options: RuntimeSensorOptions
): Promise<SensorReading[]> {
  const baseTime = options.detectedAt ?? new Date();
  const maxLength = options.maxOutputLength ?? 2000;
  const metrics = await collectRuntimeMetrics(options);

  return metrics.map((metric, index) => ({
    id: `runtime-${options.repositoryId}-${metric.category}-${Date.now()}-${index}`,
    repositoryId: options.repositoryId,
    runId: options.runId,
    source: 'runtime_metric' as SourceType,
    category: metric.category,
    severity: metric.severity,
    filePath: undefined,
    line: undefined,
    detail:
      metric.detail.length > maxLength
        ? `${metric.detail.slice(0, maxLength)}\n...[truncated]`
        : metric.detail,
    raw: metric.raw,
    detectedAt: baseTime,
  }));
}
