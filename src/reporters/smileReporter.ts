import {
  ESeverity,
  type IEndpointTestResult,
  type ILintResult,
  type ITestResult,
  type IViolation,
} from "../models/index.js";

/**
 * The Smile Signature — printed only when a spec passes with zero violations.
 */
const SMILE_SIGNATURE = `⠀⠀⠀⠀⠀⠀⣴⣶⣶⣶⣶⣮⣽⣗⣢⠤⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⠿⠿⠿⢿⣿⣿⣶⣮⣽⣒⠤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⢻⣿⣿⣮⡟⣤⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡄⠀⠀⠀⠀⠀⠀⠈⠙⠛⠿⣿⣷⣄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⣠⣴⣿⣿⣿⠗⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣀⣴⣿⡿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣿⣀⠀⠀
⠀⠀⠀⢀⣾⣿⠿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⡆⠀
⠀⠀⢰⣿⡿⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⡀
⠀⢠⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣶⣾⣿⣦⡀⠀⠀⠀⠀⠀⠀⢻⣧
⠀⣿⣿⠃⠀⠀⠀⢀⣴⣾⣿⣿⣷⠄⠀⠀⠀⢰⠛⠟⠛⠿⣿⡿⣇⠀⠀⠀⠀⠀⠸⣿
⢸⣿⡏⠀⠀⠀⠀⣾⣿⠏⠉⠈⠁⠀⠀⠀⠀⠈⠀⠀⠀⠀⠸⡇⠀⠀⠀⠀⠀⠀⠀⣿
⢸⣿⡇⠀⠀⠀⠠⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡇⠀⠀⠀⠀⠀⠀⠀⣿
⢸⣿⣇⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡇⠀⠀⠀⠀⠀⠀⢰⡇
⠘⣿⣿⡄⠀⠀⠀⢸⠃⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣬⣴⡇⠀⠀⠀⠀⠀⢠⣿⠃
⠀⠙⣿⣷⣄⠀⠀⢸⡀⠘⢿⣷⣤⣀⣀⣠⣤⣤⣴⣾⡿⠟⠁⠁⠀⠀⠀⠀⣴⡿⠃⠀
⠀⠀⠈⢿⣿⣦⠀⢸⠀⠀⢀⡟⠻⠟⣿⠿⠿⠿⡿⠉⠀⠀⠀⠀⠀⠀⣀⣾⠟⠁⠀⠀
⠀⠀⠀⠀⠙⢿⣿⣼⣀⠀⠸⡇⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣾⠟⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⠿⣿⣷⣦⣄⣀⣀⣿⡀⣀⣀⣀⣤⣴⣶⣿⠟⠉⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠛⠠⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠀⠈⠉⠉⠉⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

function formatPassed(result: ILintResult): string {
  return `${SMILE_SIGNATURE}\n\n ${result.format} spec signed clean — no violations.\n`;
}

function formatViolation(violation: IViolation, index: number): string {
  const marker = violation.severity === ESeverity.Error ? "🔴" : "🟡";
  return [
    `${marker} Scene ${index + 1} — ${violation.path}`,
    `   rule:    ${violation.ruleId}`,
    `   detail:  ${violation.message}`,
  ].join("\n");
}

function formatFailed(result: ILintResult): string {
  const header = `🚫  ${result.format} spec broke contract — ${result.violations.length} violation(s) found.\n`;
  const scenes = result.violations.map(formatViolation).join("\n\n");
  return `${header}\n${scenes}\n`;
}

/**
 * Renders a lint result as the Smile Signature Report: the ASCII smile
 * on a clean pass, or a list of "crime scenes" on failure.
 */
export function renderSmileReport(result: ILintResult): string {
  return result.passed ? formatPassed(result) : formatFailed(result);
}

/**
 * Formats one endpoint's runtime test outcome: skipped, clean, or breached.
 */
function formatEndpointResult(endpoint: IEndpointTestResult): string {
  const label = `${endpoint.method} ${endpoint.path}`;

  if (endpoint.skipped) {
    return `⏭️  ${label} — skipped (${endpoint.skipReason})`;
  }

  if (endpoint.violations.length === 0) {
    return `✅ ${label} — matches contract`;
  }

  const scenes = endpoint.violations
    .map((violation, index) => formatViolation(violation, index))
    .join("\n\n");

  return `🚫 ${label} — contract breached\n\n${scenes}`;
}

/**
 * Renders a runtime smoke test result: the Smile Signature if every
 * tested endpoint matched its contract, or a per-endpoint breakdown
 * (including skipped ones) otherwise.
 */
export function renderSmileTestReport(result: ITestResult): string {
  const tested = result.endpoints.filter((endpoint) => !endpoint.skipped);
  const skipped = result.endpoints.filter((endpoint) => endpoint.skipped);

  const header = `Testing against ${result.baseUrl} — ${tested.length} endpoint(s) tested, ${skipped.length} skipped\n`;
  const body = result.endpoints.map(formatEndpointResult).join("\n\n");

  if (result.passed) {
    return `${header}\n${body}\n\n${SMILE_SIGNATURE}\n\n😊  All tested endpoints honor the contract.\n`;
  }

  return `${header}\n${body}\n`;
}