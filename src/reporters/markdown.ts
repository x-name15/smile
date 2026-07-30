import { ESeverity, type ILintResult, type ITestResult } from "../models/index.js";
import { emitCIAnnotations } from "./utils.js";

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
      const lines = endpoint.violations.map(v => `- ${v.ruleId}: ${v.message} (${v.path})`).join("<br>");
      md += `| ${icon} | ${label} | ${lines} |\n`;
    }
  }

  return md;
}
