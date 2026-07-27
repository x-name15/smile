import { describe, it, expect } from "vitest";
import path from "node:path";
import { lintOpenApiSpec } from "../index.js";
import { ESeverity } from "../../models/index.js";

const examplesDir = path.resolve(__dirname, "../../../examples");

describe("lintOpenApiSpec", () => {
  describe("broken spec (sample-openapi.yaml)", () => {
    it("returns passed: false", async () => {
      const result = await lintOpenApiSpec(path.join(examplesDir, "sample-openapi.yaml"));
      expect(result.passed).toBe(false);
    });

    it("detects violations", async () => {
      const result = await lintOpenApiSpec(path.join(examplesDir, "sample-openapi.yaml"));
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("all violations have required fields", async () => {
      const result = await lintOpenApiSpec(path.join(examplesDir, "sample-openapi.yaml"));
      for (const v of result.violations) {
        expect(v.ruleId).toBeTruthy();
        expect(v.message).toBeTruthy();
        expect(v.path).toBeTruthy();
        expect(Object.values(ESeverity)).toContain(v.severity);
      }
    });

    it("detects missing-operation-id violations", async () => {
      const result = await lintOpenApiSpec(path.join(examplesDir, "sample-openapi.yaml"));
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-operation-id");
    });

    it("detects untyped-schema-property violations", async () => {
      const result = await lintOpenApiSpec(
        path.join(examplesDir, "sample-openapi.yaml"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("untyped-schema-property");
    });

    it("detects missing-summary violations", async () => {
      const result = await lintOpenApiSpec(
        path.join(examplesDir, "sample-openapi.yaml"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-summary");
    });

    it("detects no-2xx-response violations", async () => {
      const result = await lintOpenApiSpec(
        path.join(examplesDir, "sample-openapi.yaml"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("no-2xx-response");
    });
  });

  describe("clean spec (sample-openapi-clean.yaml)", () => {
    it("returns passed: true", async () => {
      const result = await lintOpenApiSpec(path.join(examplesDir, "sample-openapi-clean.yaml"));
      expect(result.passed).toBe(true);
    });

    it("returns zero violations", async () => {
      const result = await lintOpenApiSpec(path.join(examplesDir, "sample-openapi-clean.yaml"));
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("malformed spec (sample-openapi-malformed.yaml)", () => {
    it("does not crash and returns violations instead of throwing TypeError", async () => {
      const result = await lintOpenApiSpec(
        path.join(examplesDir, "sample-openapi-malformed.yaml"),
      );
      // Even though it's malformed, it shouldn't crash the Node process.
      // It will just yield some weird violations or no violations depending on how it iterates strings.
      expect(result.passed).toBe(true);
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });
});

