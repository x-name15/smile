import { ESeverity, type ILintResult, type ITestResult } from "../models/index.js";

function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Renders a lint result as a JUnit XML report.
 */
export function renderJunitReport(result: ILintResult): string {
  const failuresCount = result.violations.filter(v => v.severity === ESeverity.Error).length;
  const testsCount = Math.max(result.violations.length, 1);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="Smile Lint">\n`;
  xml += `  <testsuite name="Spec Validation: ${escapeXml(result.sourcePath)}" tests="${testsCount}" failures="${failuresCount}" errors="0" skipped="0">\n`;

  if (result.passed && result.violations.length === 0) {
    xml += `    <testcase classname="${escapeXml(result.format)}" name="Contract adheres to all rules" />\n`;
  } else {
    for (const v of result.violations) {
      xml += `    <testcase classname="${escapeXml(v.path)}" name="${escapeXml(v.ruleId)}">\n`;
      if (v.severity === ESeverity.Error) {
        xml += `      <failure message="${escapeXml(v.message)}" type="Violation">${escapeXml(v.message)}</failure>\n`;
      }
      xml += `    </testcase>\n`;
    }
  }

  xml += `  </testsuite>\n`;
  xml += `</testsuites>\n`;
  
  return xml;
}

/**
 * Renders a runtime smoke test result as a JUnit XML report.
 */
export function renderJunitTestReport(result: ITestResult): string {
  const testsCount = result.endpoints.length || 1;
  let failuresCount = 0;
  let skippedCount = 0;

  let casesXml = "";

  if (result.endpoints.length === 0) {
    casesXml += `    <testcase classname="SmokeTest" name="No endpoints tested" />\n`;
  } else {
    for (const endpoint of result.endpoints) {
      if (endpoint.skipped) {
        skippedCount++;
        casesXml += `    <testcase classname="${escapeXml(endpoint.path)}" name="${escapeXml(endpoint.method)}">\n`;
        casesXml += `      <skipped message="${escapeXml(endpoint.skipReason)}" />\n`;
        casesXml += `    </testcase>\n`;
      } else if (endpoint.violations.length === 0) {
        casesXml += `    <testcase classname="${escapeXml(endpoint.path)}" name="${escapeXml(endpoint.method)}" />\n`;
      } else {
        const hasErrors = endpoint.violations.some(v => v.severity === ESeverity.Error);
        if (hasErrors) failuresCount++;
        
        casesXml += `    <testcase classname="${escapeXml(endpoint.path)}" name="${escapeXml(endpoint.method)}">\n`;
        for (const v of endpoint.violations) {
          if (v.severity === ESeverity.Error) {
            casesXml += `      <failure message="${escapeXml(v.message)}" type="Violation">${escapeXml(v.message)} (${escapeXml(v.path)})</failure>\n`;
          }
        }
        casesXml += `    </testcase>\n`;
      }
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="Smile Smoke Test">\n`;
  xml += `  <testsuite name="Runtime Validation: ${escapeXml(result.baseUrl)}" tests="${testsCount}" failures="${failuresCount}" errors="0" skipped="${skippedCount}">\n`;
  xml += casesXml;
  xml += `  </testsuite>\n`;
  xml += `</testsuites>\n`;
  
  return xml;
}
