import { describe, expect, it } from "vitest";
import { ESeverity, ESpecFormat, type ILintResult, type ITestResult } from "../../models/index.js";
import { renderJunitReport, renderJunitTestReport } from "../junit.js";

describe("renderJunitReport", () => {
  it("escapes XML attributes and text", () => {
    const result: ILintResult = {
      format: ESpecFormat.OpenApi,
      passed: false,
      sourcePath: "spec&<.yaml",
      violations: [
        {
          ruleId: "bad&rule",
          severity: ESeverity.Error,
          message: 'Expected <value> & "text"',
          path: "paths./users/{id}",
        },
      ],
    };

    const xml = renderJunitReport(result);

    expect(xml).toContain("Spec Validation: spec&amp;&lt;.yaml");
    expect(xml).toContain("name=\"bad&amp;rule\"");
    expect(xml).toContain("message=\"Expected &lt;value&gt; &amp; &quot;text&quot;\"");
    expect(xml).toContain("&lt;value&gt; &amp; &quot;text&quot;");
  });
});

describe("renderJunitTestReport", () => {
  it("renders failures and skipped endpoints in JUnit XML format", () => {
    const testResult: ITestResult = {
      format: ESpecFormat.OpenApi,
      baseUrl: "https://api.example.com",
      passed: false,
      sourcePath: "openapi.yaml",
      endpoints: [
        {
          method: "GET",
          path: "/users",
          violations: [],
          skipped: false,
        },
        {
          method: "POST",
          path: "/users",
          violations: [
            {
              ruleId: "unexpected-status-code",
              severity: ESeverity.Error,
              message: "Expected status 201, got 500",
              path: "POST /users",
            },
          ],
          skipped: false,
        },
        {
          method: "DELETE",
          path: "/users/{id}",
          violations: [],
          skipped: true,
          skipReason: "No example value",
        },
      ],
    };

    const xml = renderJunitTestReport(testResult);

    expect(xml).toContain('<testsuite name="Runtime Validation: https://api.example.com" tests="3" failures="1" errors="0" skipped="1">');
    expect(xml).toContain('<testcase classname="/users" name="GET" />');
    expect(xml).toContain('<failure message="Expected status 201, got 500" type="Violation">Expected status 201, got 500 (POST /users)</failure>');
    expect(xml).toContain('<skipped message="No example value" />');
  });

  it("handles empty endpoints array gracefully", () => {
    const testResult: ITestResult = {
      format: ESpecFormat.OpenApi,
      baseUrl: "https://api.example.com",
      passed: true,
      sourcePath: "openapi.yaml",
      endpoints: [],
    };

    const xml = renderJunitTestReport(testResult);
    expect(xml).toContain('<testcase classname="SmokeTest" name="No endpoints tested" />');
  });
});