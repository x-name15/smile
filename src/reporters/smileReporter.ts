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
  let warningsText = "";
  if (result.violations.length > 0) {
    const scenes = result.violations.map(formatViolation).join("\n\n");
    warningsText = `🟡 ${result.format} spec has ${result.violations.length} warning(s):\n\n${scenes}\n\n`;
  }
  return `${warningsText}${SMILE_SIGNATURE}\n\n ${result.format} spec signed clean — no errors.\n`;
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

function emitCIAnnotations(violations: IViolation[], sourcePath: string): void {
  if (process.env.GITHUB_ACTIONS !== "true") return;
  for (const violation of violations) {
    const level = violation.severity === ESeverity.Error ? "error" : "warning";
    const msg = `[${violation.ruleId}] ${violation.message} (Path: ${violation.path})`;
    console.log(`::${level} file=${sourcePath}::${msg}`);
  }
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

/**
 * Renders a lint result as a GitHub-friendly Markdown table.
 */
export function renderMarkdownReport(result: ILintResult): string {
  emitCIAnnotations(result.violations, result.sourcePath);
  
  if (result.passed && result.violations.length === 0) {
    return `### ✅ Smile Report: ${result.format} spec signed clean — no errors.\n`;
  }

  let md = `### ${result.passed ? "🟡" : "🚫"} Smile Report: ${result.format}\n\n`;
  md += `| Severity | Rule | Message | Path |\n`;
  md += `|---|---|---|---|\n`;

  for (const v of result.violations) {
    const icon = v.severity === ESeverity.Error ? "🔴 Error" : "🟡 Warn";
    md += `| ${icon} | \`${v.ruleId}\` | ${v.message} | \`${v.path}\` |\n`;
  }

  return md;
}

/**
 * Renders a smoke test result as a Markdown table.
 */
export function renderMarkdownTestReport(result: ITestResult): string {
  const allViolations = result.endpoints.flatMap(e => e.violations);
  emitCIAnnotations(allViolations, result.sourcePath);
  
  let md = `### 🌐 Smile Smoke Test: ${result.baseUrl}\n\n`;
  md += `| Status | Endpoint | Details |\n`;
  md += `|---|---|---|\n`;

  for (const endpoint of result.endpoints) {
    const label = `**${endpoint.method}** \`${endpoint.path}\``;
    
    if (endpoint.skipped) {
      md += `| ⏭️ Skipped | ${label} | ${endpoint.skipReason} |\n`;
    } else if (endpoint.violations.length === 0) {
      md += `| ✅ Clean | ${label} | Matches contract |\n`;
    } else {
      const hasErrors = endpoint.violations.some(v => v.severity === ESeverity.Error);
      const icon = hasErrors ? "🔴 Failed" : "🟡 Warn";
      const details = endpoint.violations.map(v => `\`${v.ruleId}\`: ${v.message}`).join("<br>");
      md += `| ${icon} | ${label} | ${details} |\n`;
    }
  }

  return md;
}