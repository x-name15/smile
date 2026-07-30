import { describe, it, expect } from "vitest";
import path from "node:path";
import { lintAsyncApiSpec } from "../index.js";
import { ESpecFormat, ESeverity } from "../../models/index.js";

const fixturesDir = path.resolve(__dirname, "../../../fixtures");

describe("lintAsyncApiSpec", () => {
  describe("broken spec (sample-asyncapi.yaml)", () => {
    it("returns passed: false", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi.yaml"));
      expect(result.passed).toBe(false);
    });

    it("sets format to AsyncApi", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi.yaml"));
      expect(result.format).toBe(ESpecFormat.AsyncApi);
    });

    it("detects violations", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi.yaml"));
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("all violations have required fields", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi.yaml"));
      for (const v of result.violations) {
        expect(v.ruleId).toBeTruthy();
        expect(v.message).toBeTruthy();
        expect(v.path).toBeTruthy();
        expect(Object.values(ESeverity)).toContain(v.severity);
      }
    });

    it("detects missing-operation-id violations", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi.yaml"));
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-operation-id");
    });

    it("detects untyped-schema-property violations", async () => {
      const result = await lintAsyncApiSpec(
        path.join(fixturesDir, "sample-asyncapi.yaml"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("untyped-schema-property");
    });

    it("detects missing-channel-description violations", async () => {
      const result = await lintAsyncApiSpec(
        path.join(fixturesDir, "sample-asyncapi.yaml"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-channel-description");
    });

    it("detects missing-message-description violations", async () => {
      const result = await lintAsyncApiSpec(
        path.join(fixturesDir, "sample-asyncapi.yaml"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-message-description");
    });
  });

  describe("clean spec (sample-asyncapi-clean.yaml)", () => {
    it("returns passed: true", async () => {
      const result = await lintAsyncApiSpec(
        path.join(fixturesDir, "sample-asyncapi-clean.yaml"),
      );
      expect(result.passed).toBe(true);
    });

    it("returns zero violations", async () => {
      const result = await lintAsyncApiSpec(
        path.join(fixturesDir, "sample-asyncapi-clean.yaml"),
      );
      expect(result.violations).toHaveLength(0);
    });
  });
});
