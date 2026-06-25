import { ValidationResult, ValidationReport, Fix } from "./types";

export interface ValidationContext {
  repo: string;
  branch: string;
  pr?: number;
}

export function createValidationReport(
  status: ValidationReport["status"],
): ValidationReport {
  return {
    status,
    testsPassed: false,
    typecheckPassed: false,
    lintPassed: false,
    reviewRequired: false,
    warnings: [],
    errors: [],
  };
}

export function createValidationResult(fix: Fix): ValidationResult {
  return {
    report: createValidationReport("failed"),
    fix,
  };
}

export async function runValidation(
  ctx: ValidationContext,
): Promise<ValidationResult> {
  const fix: Fix = {
    id: ctx.repo,
    findingId: ctx.repo,
    summary: "",
    patch: "",
    risk: "low",
  };
  return createValidationResult(fix);
}
