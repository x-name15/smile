import { describe, expect, it } from "vitest";
import { ESeverity, ESpecFormat, type ILintResult, type ITestResult } from "../../models/index.js";
import { renderSmileReport, renderSmileTestReport } from "../cli.js";
import { renderMarkdownReport, renderMarkdownTestReport } from "../markdown.js";

describe("CLI and Markdown reporters", () => {
  const passingLintResult: ILintResult = {
    format: ESpecFormat.OpenApi,
    passed: true,
    sourcePath: "openapi.yaml",
    violations: [],
  };

  const failingLintResult: ILintResult = {
    format: ESpecFormat.OpenApi,
    passed: false,
    sourcePath: "openapi.yaml",
    violations: [
      {
        ruleId: "missing-operation-id",
        severity: ESeverity.Error,
        message: 'Operation "GET /users" is missing an operationId',
        path: "paths./users.get",
      },
    ],
  };

  const warningLintResult: ILintResult = {
    format: ESpecFormat.OpenApi,
    passed: true,
    sourcePath: "openapi.yaml",
    violations: [
      {
        ruleId: "missing-summary",
        severity: ESeverity.Warning,
        message: 'Operation "GET /users" is missing a summary',
        path: "paths./users.get.summary",
      },
    ],
  };

  const passingTestResult: ITestResult = {
    format: ESpecFormat.OpenApi,
    baseUrl: "http://localhost:3000",
    passed: true,
    sourcePath: "openapi.yaml",
    endpoints: [
      {
        method: "GET",
        path: "/users",
        violations: [],
        skipped: false,
      },
    ],
  };

  const failingTestResult: ITestResult = {
    format: ESpecFormat.OpenApi,
    baseUrl: "http://localhost:3000",
    passed: false,
    sourcePath: "openapi.yaml",
    endpoints: [
      {
        method: "GET",
        path: "/users",
        violations: [
          {
            ruleId: "unexpected-status-code",
            severity: ESeverity.Error,
            message: "Expected status 200, got 500",
            path: "GET /users",
          },
        ],
        skipped: false,
      },
      {
        method: "DELETE",
        path: "/users/{id}",
        violations: [],
        skipped: true,
        skipReason: "Parameter id has no example",
      },
    ],
  };

  describe("renderSmileReport (CLI)", () => {
    it("prints ASCII smile signature on clean pass", () => {
      const output = renderSmileReport(passingLintResult);
      expect(output).toContain("openapi spec signed clean — no errors.");
      expect(output).toContain("⠿⢿⣿⣿");
    });

    it("prints crime scenes and broken contract message on failure", () => {
      const output = renderSmileReport(failingLintResult);
      expect(output).toContain("openapi spec broke contract — 1 violation(s) found.");
      expect(output).toContain("🔴 Scene 1 — paths./users.get");
      expect(output).toContain("missing-operation-id");
      expect(output).not.toContain("openapi spec signed clean");
    });

    it("prints warnings along with the smile signature when passed is true", () => {
      const output = renderSmileReport(warningLintResult);
      expect(output).toContain("openapi spec has 1 warning(s)");
      expect(output).toContain("🟡 Scene 1 — paths./users.get.summary");
      expect(output).toContain("openapi spec signed clean — no errors.");
    });
  });

  describe("renderSmileTestReport (CLI)", () => {
    it("prints ASCII smile signature when all endpoints pass", () => {
      const output = renderSmileTestReport(passingTestResult);
      expect(output).toContain("✅ GET /users — matches contract");
      expect(output).toContain("All tested endpoints honor the contract.");
      expect(output).toContain("⠿⢿⣿⣿");
    });

    it("prints contract breached and crime scenes on test failure without ASCII smile", () => {
      const output = renderSmileTestReport(failingTestResult);
      expect(output).toContain("🚫 GET /users — contract breached");
      expect(output).toContain("unexpected-status-code");
      expect(output).toContain("⏭️  DELETE /users/{id} — skipped (Parameter id has no example)");
      expect(output).not.toContain("All tested endpoints honor the contract.");
    });
  });

  describe("renderMarkdownReport", () => {
    it("renders clean markdown message on pass", () => {
      const md = renderMarkdownReport(passingLintResult);
      expect(md).toContain("### ✅ Smile Report: openapi spec signed clean — no errors.");
    });

    it("renders table with error icon and details on failure", () => {
      const md = renderMarkdownReport(failingLintResult);
      expect(md).toContain("### 🚫 Smile Report: openapi");
      expect(md).toContain("| 🔴 Error | `missing-operation-id` | Operation \"GET /users\" is missing an operationId | `paths./users.get` |");
    });
  });

  describe("renderMarkdownTestReport", () => {
    it("renders markdown table for smoke test results", () => {
      const md = renderMarkdownTestReport(failingTestResult);
      expect(md).toContain("### 🌐 Smile Smoke Test: http://localhost:3000");
      expect(md).toContain("| 🔴 Failed | **GET** `/users` | - unexpected-status-code: Expected status 200, got 500 (GET /users) |");
      expect(md).toContain("| ⏭️ Skipped | **DELETE** `/users/{id}` | Parameter id has no example |");
    });
  });
});
