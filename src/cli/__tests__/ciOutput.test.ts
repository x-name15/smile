import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ESeverity, ESpecFormat, type ILintResult, type ITestResult } from "../../models/index.js";
import { renderMarkdownReport, renderMarkdownTestReport } from "../../reporters/markdown.js";

describe("CI Output Cleanliness in GitHub Actions", () => {
  const originalEnv = process.env.GITHUB_ACTIONS;

  beforeEach(() => {
    process.env.GITHUB_ACTIONS = "true";
  });

  afterEach(() => {
    process.env.GITHUB_ACTIONS = originalEnv;
    vi.restoreAllMocks();
  });

  const failingLintResult: ILintResult = {
    format: ESpecFormat.OpenApi,
    passed: false,
    sourcePath: "sample.yaml",
    violations: [
      {
        ruleId: "missing-operation-id",
        severity: ESeverity.Error,
        message: "Operation is missing operationId",
        path: "paths./test.get",
      },
    ],
  };

  const failingTestResult: ITestResult = {
    format: ESpecFormat.OpenApi,
    baseUrl: "https://api.example.com",
    passed: false,
    sourcePath: "sample.yaml",
    endpoints: [
      {
        method: "GET",
        path: "/test",
        violations: [
          {
            ruleId: "unexpected-status-code",
            severity: ESeverity.Error,
            message: "Expected 200, got 500",
            path: "GET /test",
          },
        ],
        skipped: false,
      },
    ],
  };

  it("suppresses console.log annotations when skipAnnotations: true is provided to renderMarkdownReport", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const markdown = renderMarkdownReport(failingLintResult, { skipAnnotations: true });

    expect(markdown).toContain("Smile Report: openapi");
    expect(markdown).toContain("missing-operation-id");
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("suppresses console.log annotations when skipAnnotations: true is provided to renderMarkdownTestReport", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const markdown = renderMarkdownTestReport(failingTestResult, { skipAnnotations: true });

    expect(markdown).toContain("Smile Smoke Test");
    expect(markdown).toContain("unexpected-status-code");
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("emits annotations when skipAnnotations is omitted (default behavior)", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    renderMarkdownReport(failingLintResult);

    expect(logSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("::error file=sample.yaml::[missing-operation-id]")
    );
  });
});