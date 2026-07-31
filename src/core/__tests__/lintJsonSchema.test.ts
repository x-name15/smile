import { describe, it, expect } from "vitest";
import path from "node:path";
import { lintJsonSchemaSpec } from "../index.js";
import { ESpecFormat, ESeverity } from "../../models/index.js";

const fixturesDir = path.resolve(__dirname, "../../../fixtures");

describe("lintJsonSchemaSpec", () => {
  describe("broken spec (sample-jsonschema.json)", () => {
    it("returns passed: false", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema.json"),
      );
      expect(result.passed).toBe(false);
    });

    it("sets format to JsonSchema", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema.json"),
      );
      expect(result.format).toBe(ESpecFormat.JsonSchema);
    });

    it("detects violations", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema.json"),
      );
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("all violations have required fields", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema.json"),
      );
      for (const v of result.violations) {
        expect(v.ruleId).toBeTruthy();
        expect(v.message).toBeTruthy();
        expect(v.path).toBeTruthy();
        expect(Object.values(ESeverity)).toContain(v.severity);
      }
    });

    it("detects missing-title violation", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema.json"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-title");
    });

    it("detects untyped-property violations", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema.json"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("untyped-property");
    });

    it("detects array-without-items violations", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema.json"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("array-without-items");
    });

    it("detects require-additional-properties violations", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema.json"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("require-additional-properties");
    });
  });

  describe("clean spec (sample-jsonschema-clean.json)", () => {
    it("returns passed: true", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema-clean.json"),
      );
      expect(result.passed).toBe(true);
    });

    it("returns zero violations", async () => {
      const result = await lintJsonSchemaSpec(
        path.join(fixturesDir, "sample-jsonschema-clean.json"),
      );
      expect(result.violations).toHaveLength(0);
    });
  });
});
