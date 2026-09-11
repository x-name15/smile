import { describe, expect, it } from "vitest";
import { ESeverity, ESpecFormat, type ILintResult, type ITestResult } from "../../models/index.js";
import { renderJunitReport, renderAggregateJunitReport, renderJunitTestReport } from "../junit.js";

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

describe("renderAggregateJunitReport", () => {
  it("renders a single XML document containing multiple testsuites without duplicate headers", () => {
    const cleanResult: ILintResult = {
      format: ESpecFormat.OpenApi,
      passed: true,
      sourcePath: "spec-clean.yaml",
      violations: [],
    };

    const failingResult: ILintResult = {
      format: ESpecFormat.AsyncApi,
      passed: false,
      sourcePath: "spec-broken.yaml",
      violations: [
        {
          ruleId: "require-channel-description",
          severity: ESeverity.Error,
          message: "Missing description",
          path: "channels.user.signedup",
        },
      ],
    };

    const xml = renderAggregateJunitReport([cleanResult, failingResult]);

    // Exactly one XML declaration
    const xmlDeclarationMatches = xml.match(/<\?xml version="1.0" encoding="UTF-8"\?>/g);
    expect(xmlDeclarationMatches).toHaveLength(1);

    // Exactly one opening and closing testsuites tag
    expect(xml.match(/<testsuites name="Smile Lint">/g)).toHaveLength(1);
    expect(xml.match(/<\/testsuites>/g)).toHaveLength(1);

    // Contains both testsuite elements
    expect(xml).toContain('<testsuite name="Spec Validation: spec-clean.yaml"');
    expect(xml).toContain('<testsuite name="Spec Validation: spec-broken.yaml"');
    expect(xml).toContain('<failure message="Missing description" type="Violation">Missing description</failure>');
  });

  it("handles empty results array with valid root container", () => {
    const xml = renderAggregateJunitReport([]);
    expect(xml).toBe(`<?xml version="1.0" encoding="UTF-8"?>\n<testsuites name="Smile Lint">\n</testsuites>\n`);
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