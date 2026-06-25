import {
  LoopState,
  LoopRunOutcome,
  Finding,
  Fix,
  LoopTelemetryEvent,
  AutonomyPolicy,
} from "./types";

export async function runAutonomousLoop(
  target: string,
  services: {
    monitor: (target: string) => Promise<Finding[]>;
    diagnose: (finding: Finding) => Promise<Fix>;
    synthesize: (fix: Fix) => Promise<string>;
    validate?: (
      fix: Fix,
      patch: string,
    ) => Promise<import("./types").ValidationResult>;
    apply?: (target: string, patch: string) => Promise<void>;
    telemetry: { emit: (event: LoopTelemetryEvent) => Promise<void> | void };
    policy?: { current: () => Promise<AutonomyPolicy> };
  },
): Promise<LoopRunOutcome> {
  let state: LoopState = { status: "idle" };
  const start = new Date();
  let findingsDiscovered = 0;
  let fixesAttempted = 0;
  let fixesApplied = 0;
  let reviewRequired = 0;
  let failures = 0;

  const findings = await services.monitor(target);
  findingsDiscovered = findings.length;
  for (const finding of findings) {
    try {
      const fix = await services.diagnose(finding);
      fixesAttempted += 1;

      const patch = await services.synthesize(fix);
      const validation = services.validate
        ? await services.validate(fix, patch)
        : null;

      if (validation && validation.report.status === "passed") {
        if (services.apply) {
          await services.apply(target, patch);
          fixesApplied += 1;
        }
      } else {
        reviewRequired += 1;
      }
    } catch {
      failures += 1;
    }
  }

  state = { status: "idle" };
  const runId = `run-${start.toISOString()}`;
  const outcome: LoopRunOutcome = {
    runId,
    target,
    finishedAt: new Date(),
    findingsDiscovered,
    fixesAttempted,
    fixesApplied,
    reviewRequired,
    failures,
    lastState: state,
    policyAfterRun: services.policy
      ? await services.policy.current()
      : undefined,
  };

  await services.telemetry.emit({
    type: "loop_completed",
    runId,
    occurredAt: new Date(),
    payload: { outcome },
  });

  return outcome;
}
