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

  it("handles nested format rules perfectly", () => {
    const config: ISmileConfig = {
      rules: {
        openapi: {
          "rule-a": "off",
        },
        asyncapi: {
          "rule-b": "warn",
        }
      },
    };
    
    const clonedOpenApi = JSON.parse(JSON.stringify(dummyViolations)) as IViolation[];
    // @ts-ignore using hardcoded string for test
    const resultOpenApi = applyConfigToViolations(clonedOpenApi, config, "openapi");
    
    expect(resultOpenApi).toHaveLength(2); // rule-a was dropped
    expect(resultOpenApi.find((v) => v.ruleId === "rule-a")).toBeUndefined();
    expect(resultOpenApi.find((v) => v.ruleId === "rule-b")?.severity).toBe(ESeverity.Error); // not warned because we are in openapi format

    const clonedAsyncApi = JSON.parse(JSON.stringify(dummyViolations)) as IViolation[];
    // @ts-ignore using hardcoded string for test
    const resultAsyncApi = applyConfigToViolations(clonedAsyncApi, config, "asyncapi");
    
    expect(resultAsyncApi).toHaveLength(3);
    expect(resultAsyncApi.find((v) => v.ruleId === "rule-a")?.severity).toBe(ESeverity.Error);
    expect(resultAsyncApi.find((v) => v.ruleId === "rule-b")?.severity).toBe(ESeverity.Warning); // warned because we are in asyncapi format
  });

  it("does not mutate the passed config object", () => {
    const originalConfig: ISmileConfig = Object.freeze({});
    const violations = [...dummyViolations];
    expect(() => applyConfigToViolations(violations, originalConfig)).not.toThrow();
  });

  describe("Inline YAML Suppressions", () => {
    const fs = require("node:fs");
    const os = require("node:os");
    const path = require("node:path");

    let tempDir: string;

    it("suppresses single, multiple, and wildcard rules via AST comments", () => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smile-config-test-"));
      const yamlFile = path.join(tempDir, "spec.yaml");

      const yamlContent = `
paths:
  /users:
    # smile-ignore-next-line missing-summary, missing-operation-id
    get:
      responses: {}
    # smile-ignore-next-line all
    post:
      responses: {}
    delete: # smile-ignore-line require-security
      responses: {}
`;
      fs.writeFileSync(yamlFile, yamlContent, "utf-8");

      const violations: IViolation[] = [
        {
          ruleId: "missing-summary",
          severity: ESeverity.Error,
          message: "Missing summary",
          path: "paths./users.get.summary",
        },
        {
          ruleId: "missing-operation-id",
          severity: ESeverity.Error,
          message: "Missing operationId",
          path: "paths./users.get",
        },
        {
          ruleId: "missing-summary",
          severity: ESeverity.Error,
          message: "Missing summary",
          path: "paths./users.post.summary",
        },
        {
          ruleId: "require-security",
          severity: ESeverity.Error,
          message: "Missing security",
          path: "paths./users.delete",
        },
        {
          ruleId: "other-rule",
          severity: ESeverity.Error,
          message: "Other violation",
          path: "paths./users.get",
        },
      ];

      const filtered = applyConfigToViolations(violations, {}, undefined, yamlFile);

      // 'missing-summary' on GET was suppressed (comma list)
      // 'missing-operation-id' on GET was suppressed (comma list)
      // 'missing-summary' on POST was suppressed (all wildcard)
      // 'require-security' on DELETE was suppressed (same-line smile-ignore-line)
      // 'other-rule' on GET was NOT suppressed
      expect(filtered).toHaveLength(1);
      expect(filtered[0].ruleId).toBe("other-rule");

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
});
