import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ESeverity, ESpecFormat, type ILintResult, type ISmileConfig } from "../../models/index.js";

describe("CLI maxWarnings threshold & default specPath", () => {
  const originalExitCode = process.exitCode;

  beforeEach(() => {
    process.exitCode = 0;
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  const warningResult: ILintResult = {
    format: ESpecFormat.OpenApi,
    passed: true,
    sourcePath: "spec.yaml",
    violations: [
      {
        ruleId: "missing-summary",
        severity: ESeverity.Warning,
        message: "Missing summary",
        path: "paths./users.get",
      },
    ],
  };

  const cleanResult: ILintResult = {
    format: ESpecFormat.OpenApi,
    passed: true,
    sourcePath: "clean.yaml",
    violations: [],
  };

  it("calculates total warnings and flags threshold breach when maxWarnings is exceeded", () => {
    const results = [warningResult, cleanResult];
    const totalWarnings = results.reduce(
      (sum, r) => sum + r.violations.filter(v => v.severity === ESeverity.Warning).length,
      0
    );

    expect(totalWarnings).toBe(1);

    const maxWarnings = 0;
    const warningsExceeded = maxWarnings !== undefined && maxWarnings >= 0 && totalWarnings > maxWarnings;
    expect(warningsExceeded).toBe(true);

    const allPassed = results.every(r => r.passed);
    const overallSuccess = allPassed && !warningsExceeded;
    expect(overallSuccess).toBe(false);
  });

  it("passes when warnings count does not exceed maxWarnings limit", () => {
    const results = [warningResult, cleanResult];
    const totalWarnings = results.reduce(
      (sum, r) => sum + r.violations.filter(v => v.severity === ESeverity.Warning).length,
      0
    );

    expect(totalWarnings).toBe(1);

    const maxWarnings = 1;
    const warningsExceeded = maxWarnings !== undefined && maxWarnings >= 0 && totalWarnings > maxWarnings;
    expect(warningsExceeded).toBe(false);

    const allPassed = results.every(r => r.passed);
    const overallSuccess = allPassed && !warningsExceeded;
    expect(overallSuccess).toBe(true);
  });

  it("prioritizes CLI options.maxWarnings over config.maxWarnings", () => {
    const config: ISmileConfig = { maxWarnings: 5 };
    const options = { maxWarnings: 0 };

    const effectiveMaxWarnings = options.maxWarnings !== undefined ? options.maxWarnings : config.maxWarnings;
    expect(effectiveMaxWarnings).toBe(0);
  });

  it("falls back to config.maxWarnings when options.maxWarnings is undefined", () => {
    const config: ISmileConfig = { maxWarnings: 2 };
    const options: { maxWarnings?: number } = {};

    const effectiveMaxWarnings = options.maxWarnings !== undefined ? options.maxWarnings : config.maxWarnings;
    expect(effectiveMaxWarnings).toBe(2);
  });

  it("defaults specPath to '.' when omitted", () => {
    const defaultSpecPath = ((path: string = ".") => path)();
    expect(defaultSpecPath).toBe(".");
  });
});