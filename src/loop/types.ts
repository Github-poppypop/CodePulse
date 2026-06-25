export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type FindingCategory =
  | "bug"
  | "performance"
  | "security"
  | "maintainability"
  | "test_coverage"
  | "type_safety";

export interface Finding {
  id: string;
  source: string;
  severity: Severity;
  category: FindingCategory;
  title: string;
  description: string;
  location?: {
    path: string;
    startLine?: number;
    endLine?: number;
  };
  detectorConfidence?: number;
  metadata?: Record<string, unknown>;
}

export interface Fix {
  id: string;
  findingId: string;
  summary: string;
  patch: string;
  risk: Severity;
  followUpActions?: string[];
  metadata?: Record<string, unknown>;
}

export interface ValidationReport {
  status: "passed" | "failed" | "requires_review";
  testsPassed: boolean;
  typecheckPassed: boolean;
  lintPassed: boolean;
  reviewRequired: boolean;
  warnings: string[];
  errors: string[];
}

export interface ValidationReport {
  status: "passed" | "failed" | "requires_review";
  testsPassed: boolean;
  typecheckPassed: boolean;
  lintPassed: boolean;
  reviewRequired: boolean;
  warnings: string[];
  errors: string[];
}

export interface LoopTelemetryEvent {
  type: string;
  runId: string;
  occurredAt: Date;
  payload?: Record<string, unknown>;
}

export interface ValidationResult {
  report: ValidationReport;
  fix: Fix;
}

export type AutonomyLevel =
  | "observe_only"
  | "suggest_only"
  | "auto_pr_small"
  | "auto_pr_medium"
  | "auto_pr_large";

export interface AutonomyPolicy {
  level: AutonomyLevel;
  allowedSeverities: Severity[];
  allowedCategories: FindingCategory[];
  autoApprovePatchSizeThresholdLines: number;
  allowHighRisk: boolean;
  requireHumanReviewAboveConfidence: number | null;
  maxConsecutiveFailuresBeforePause: number;
}

export interface LoopServices {
  monitorSensors: (target: string) => Promise<Finding[]>;
  diagnoseFinding: (finding: Finding) => Promise<Fix>;
  synthesizePatch: (fix: Fix) => Promise<string>;
  validateFix?: (fix: Fix, patch: string) => Promise<ValidationResult>;
  applyPatch?: (target: string, patch: string) => Promise<void>;
  createReview?: (
    fix: Fix,
    patch: string,
    report: ValidationReport,
  ) => Promise<void>;
  telemetry: {
    emit: (event: LoopTelemetryEvent) => Promise<void> | void;
  };
  policy?: {
    current: () => Promise<AutonomyPolicy>;
    adapt?: (outcome: LoopRunOutcome) => Promise<AutonomyPolicy>;
  };
}

export type LoopState =
  | { status: "idle" }
  | { status: "monitoring"; target: string }
  | { status: "diagnosing"; finding: Finding }
  | { status: "fixing"; fix: Fix }
  | { status: "validating"; fix: Fix; patch: string }
  | { status: "applying"; fix: Fix; patch: string; report: ValidationReport }
  | { status: "paused"; reason: string; lastState: LoopState }
  | { status: "error"; error: Error };

export interface LoopRunOutcome {
  runId: string;
  target: string;
  finishedAt: Date;
  findingsDiscovered: number;
  fixesAttempted: number;
  fixesApplied: number;
  reviewRequired: number;
  failures: number;
  lastState: LoopState;
  policyAfterRun?: AutonomyPolicy;
}
