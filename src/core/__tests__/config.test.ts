import { describe, it, expect } from "vitest";
import { applyConfigToViolations } from "../config.js";
import { ESeverity, type IViolation, type ISmileConfig } from "../../models/index.js";

describe("Config Engine", () => {
  const dummyViolations: IViolation[] = [
    {
      ruleId: "rule-a",
      severity: ESeverity.Error,
      message: "Test message A",
      path: "path/a",
    },
    {
      ruleId: "rule-b",
      severity: ESeverity.Error,
      message: "Test message B",
      path: "path/b",
    },
    {
      ruleId: "rule-c",
      severity: ESeverity.Error,
      message: "Test message C",
      path: "path/c",
    },
  ];

  it("returns violations as-is if config is empty", () => {
    const config: ISmileConfig = {};
    const result = applyConfigToViolations(dummyViolations, config);
    
    expect(result).toHaveLength(3);
    expect(result[0].severity).toBe(ESeverity.Error);
  });

  it("drops violations when rule is set to 'off'", () => {
    const config: ISmileConfig = {
      rules: {
        "rule-b": "off",
      },
    };
    
    // Deep clone to avoid mutating the original array elements during tests
    const cloned = JSON.parse(JSON.stringify(dummyViolations)) as IViolation[];
    const result = applyConfigToViolations(cloned, config);
    
    expect(result).toHaveLength(2);
    expect(result.find((v) => v.ruleId === "rule-b")).toBeUndefined();
  });

  it("overrides severity to warning when rule is set to 'warn'", () => {
    const config: ISmileConfig = {
      rules: {
        "rule-a": "warn",
      },
    };
    
    const cloned = JSON.parse(JSON.stringify(dummyViolations)) as IViolation[];
    const result = applyConfigToViolations(cloned, config);
    
    expect(result).toHaveLength(3);
    const ruleA = result.find((v) => v.ruleId === "rule-a")!;
    expect(ruleA.severity).toBe(ESeverity.Warning);
    
    const ruleB = result.find((v) => v.ruleId === "rule-b")!;
    expect(ruleB.severity).toBe(ESeverity.Error); // Untouched
  });

  it("handles a mix of off, warn, and error", () => {
    const config: ISmileConfig = {
      rules: {
        "rule-a": "warn",
        "rule-b": "off",
        "rule-c": "error", // Explicitly setting error, though it's the default
      },
    };
    
    const cloned = JSON.parse(JSON.stringify(dummyViolations)) as IViolation[];
    const result = applyConfigToViolations(cloned, config);
    
    expect(result).toHaveLength(2);
    expect(result.find((v) => v.ruleId === "rule-a")?.severity).toBe(ESeverity.Warning);
    expect(result.find((v) => v.ruleId === "rule-b")).toBeUndefined();
    expect(result.find((v) => v.ruleId === "rule-c")?.severity).toBe(ESeverity.Error);
  });
});
