export type Severity = 'info' | 'warn' | 'error' | 'critical';

export type SourceType =
  | 'static_analysis'
  | 'git_history'
  | 'error_trace'
  | 'test_report'
  | 'runtime_metric'
  | 'security_scan'
  | 'performance_profile';

export interface SensorReading {
  id: string;
  repositoryId: string;
  runId?: string;
  source: SourceType;
  category: string;
  severity: Severity;
  filePath?: string;
  line?: number;
  detail: string;
  raw: unknown;
  detectedAt: Date;
}
