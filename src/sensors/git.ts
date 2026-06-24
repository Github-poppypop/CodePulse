import { execa } from 'execa';
import { SensorReading, Severity, SourceType } from './types';

export interface GitSensorOptions {
  repoPath: string;
  repositoryId: string;
  runId?: string;
  maxOutputLength?: number;
  detectedAt?: Date;
}

export interface GitStatusEntry {
  status: string;
  path: string;
}

export interface GitStatusPayload {
  branch: string;
  aheadBy: number;
  behindBy: number;
  dirtyFileCount: number;
  entries: GitStatusEntry[];
  error?: string;
}

export interface GitLogPayload {
  commits: Array<{
    sha: string;
    author: string;
    date: string;
    message: string;
  }>;
  raw: string;
  error?: string;
}

function truncate(text: string, maxLength = 2000) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}\n...[truncated]`;
}

function classifySeverity(statuses: string[]): Severity {
  const hasDirty = statuses.some((value) => !/^(\?\?| M|A|D|\s\s)$/.test(value));
  if (!hasDirty) {
    return 'info';
  }
  const hasStaged = statuses.some((value) => /^(M|A|D)/.test(value));
  if (hasStaged) {
    return 'warn';
  }
  return 'info';
}

export async function collectGitStatus(options: GitSensorOptions): Promise<GitStatusPayload> {
  try {
    const branch = await getCurrentBranch(options.repoPath);
    const statusText = await execa('git', ['status', '--porcelain', '--branch'], {
      cwd: options.repoPath,
      shell: true,
    }).then(({ stdout }) => stdout.trim());

    const entries: GitStatusEntry[] = [];
    let dirtyFileCount = 0;
    for (const line of statusText.split('\n')) {
      if (!line) {
        continue;
      }
      if (line.startsWith('##')) {
        continue;
      }
      const status = line.slice(0, 2);
      const filePath = line.slice(3);
      entries.push({ status, path: filePath });
      dirtyFileCount += 1;
    }

    const branchLine = statusText.split('\n').find((value) => value.startsWith('##')) ?? '';
    const aheadBy = matchInt(branchLine, /ahead (\d+)/);
    const behindBy = matchInt(branchLine, /behind (\d+)/);

    return {
      branch,
      aheadBy,
      behindBy,
      dirtyFileCount,
      entries,
    };
  } catch (error) {
    return {
      branch: 'unknown',
      aheadBy: 0,
      behindBy: 0,
      dirtyFileCount: 0,
      entries: [],
      error: (error as Error).message,
    };
  }
}

export async function collectGitLog(options: GitSensorOptions): Promise<GitLogPayload> {
  const maxLength = options.maxOutputLength ?? 2000;
  try {
    const { stdout } = await execa(
      'git',
      [
        'log',
        '--pretty=format:%H|%an|%ar|%s',
        '-n',
        String(Math.min(50, Math.max(options.runId?.length ?? 10, 1) * 10)),
      ],
      {
        cwd: options.repoPath,
        shell: true,
        timeout: 120_000,
      }
    );

    const commits = stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [sha, author, date, message] = line.split('|');
        return {
          sha: sha ?? '',
          author: author ?? '',
          date: date ?? '',
          message: message ?? '',
        };
      });

    return {
      commits,
      raw: truncate(stdout ?? '', maxLength),
    };
  } catch (error) {
    const message = (error as Error).message ?? String(error);
    return {
      commits: [],
      raw: truncate(message, maxLength),
      error: message,
    };
  }
}

export async function analyzeRepositoryGitHistory(options: GitSensorOptions): Promise<SensorReading[]> {
  const baseTime = options.detectedAt ?? new Date();
  const maxLength = options.maxOutputLength ?? 2000;
  const [status, log] = await Promise.all([
    collectGitStatus(options),
    collectGitLog(options),
  ]);

  const statusSeverity: Severity = status.error
    ? 'error'
    : status.dirtyFileCount > 0
      ? 'warn'
      : 'info';

  const readings: SensorReading[] = [
    {
      id: `git-${options.repositoryId}-${Date.now()}-status`,
      repositoryId: options.repositoryId,
      runId: options.runId,
      source: 'git_history',
      category: 'status',
      severity: statusSeverity,
      detail: truncate(formatStatusText(status), maxLength),
      raw: status,
      detectedAt: baseTime,
    },
    {
      id: `git-${options.repositoryId}-${Date.now()}-log`,
      repositoryId: options.repositoryId,
      runId: options.runId,
      source: 'git_history',
      category: 'log',
      severity: 'info',
      detail: truncate(formatLogText(log), maxLength),
      raw: log,
      detectedAt: baseTime,
    },
  ];

  for (const entry of status.entries) {
    readings.push({
      id: `git-${options.repositoryId}-${Date.now()}-${entry.path}`,
      repositoryId: options.repositoryId,
      runId: options.runId,
      source: 'git_history',
      category: 'working_tree',
      severity: parseInt(entry.status, 10) > 0 ? 'warn' : 'info',
      filePath: entry.path,
      detail: truncate(entry.status, maxLength),
      raw: entry,
      detectedAt: baseTime,
    });
  }

  return readings;
}

function matchInt(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  return match ? parseInt(match[1] ?? '0', 10) : 0;
}

function getCurrentBranch(repoPath: string): Promise<string> {
  return execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: repoPath,
    shell: true,
    stdio: 'pipe',
  }).then(({ stdout }) => stdout.trim());
}

function formatStatusText(payload: GitStatusPayload): string {
  if (payload.error) {
    return `Git status failed: ${payload.error}`;
  }
  const lines = [
    `branch=${payload.branch}`,
    `ahead=${payload.aheadBy}`,
    `behind=${payload.behindBy}`,
    `dirty=${payload.dirtyFileCount}`,
  ];
  for (const entry of payload.entries.slice(0, 50)) {
    lines.push(`${entry.status} ${entry.path}`);
  }
  if (payload.entries.length > 50) {
    lines.push(`...[truncated entries] ${payload.entries.length - 50} more`);
  }
  return lines.join('\n');
}

function formatLogText(payload: GitLogPayload): string {
  if (payload.error) {
    return `Git log failed: ${payload.error}`;
  }
  return payload.raw || 'No commits found.';
}
