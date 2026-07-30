import { appendFileSync } from "node:fs";
import { ESeverity, type IViolation } from "../models/index.js";

export function formatViolation(violation: IViolation, index: number): string {
  const marker = violation.severity === ESeverity.Error ? "🔴" : "🟡";
  return [
    `${marker} Scene ${index + 1} — ${violation.path}`,
    `   rule:    ${violation.ruleId}`,
    `   detail:  ${violation.message}`,
  ].join("\n");
}

export function emitCIAnnotations(violations: IViolation[], sourcePath: string): void {
  if (process.env.GITHUB_ACTIONS !== "true") return;
  for (const violation of violations) {
    const level = violation.severity === ESeverity.Error ? "error" : "warning";
    const msg = `[${violation.ruleId}] ${violation.message} (Path: ${violation.path})`;
    console.log(`::${level} file=${sourcePath}::${msg}`);
  }
}

export function emitGithubStepSummary(markdown: string): void {
  if (process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + "\n", "utf-8");
    } catch (e) {
      // Ignore errors if we can't write to the summary file
    }
  }
}
