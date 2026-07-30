import { ESeverity, type IEndpointTestResult, type ILintResult, type ITestResult } from "../models/index.js";
import { formatViolation, emitCIAnnotations } from "./utils.js";

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
  let warningsText = "";
  if (result.violations.length > 0) {
    const scenes = result.violations.map(formatViolation).join("\n\n");
    warningsText = `🟡 ${result.format} spec has ${result.violations.length} warning(s):\n\n${scenes}\n\n`;
  }
  return `${warningsText}${SMILE_SIGNATURE}\n\n ${result.format} spec signed clean — no errors.\n`;
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
  emitCIAnnotations(result.violations, result.sourcePath);
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

  const hasErrors = endpoint.violations.some(v => v.severity === ESeverity.Error);
  
  const scenes = endpoint.violations
    .map((violation, index) => formatViolation(violation, index))
    .join("\n\n");

  if (!hasErrors) {
    return `✅ ${label} — matches contract (with warnings)\n\n${scenes}`;
  }

  return `🚫 ${label} — contract breached\n\n${scenes}`;
}

/**
 * Renders a runtime smoke test result: the Smile Signature if every
 * tested endpoint matched its contract, or a per-endpoint breakdown
 * (including skipped ones) otherwise.
 */
export function renderSmileTestReport(result: ITestResult): string {
  const allViolations = result.endpoints.flatMap(e => e.violations);
  emitCIAnnotations(allViolations, result.sourcePath);

  const tested = result.endpoints.filter((endpoint) => !endpoint.skipped);
  const skipped = result.endpoints.filter((endpoint) => endpoint.skipped);

  const header = `Testing against ${result.baseUrl} — ${tested.length} endpoint(s) tested, ${skipped.length} skipped\n`;
  const body = result.endpoints.map(formatEndpointResult).join("\n\n");

  if (result.passed) {
    return `${header}\n${body}\n\n${SMILE_SIGNATURE}\n\n All tested endpoints honor the contract.\n`;
  }

  return `${header}\n${body}\n`;
}
