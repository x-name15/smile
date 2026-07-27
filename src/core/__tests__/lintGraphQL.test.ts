import { describe, it, expect } from "vitest";
import path from "node:path";
import { lintGraphQLSpec } from "../index.js";
import { ESpecFormat, ESeverity } from "../../models/index.js";

const examplesDir = path.resolve(__dirname, "../../../examples");

describe("lintGraphQLSpec", () => {
  describe("broken spec (sample-graphql.graphql)", () => {
    it("returns passed: false", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql.graphql"),
      );
      expect(result.passed).toBe(false);
    });

    it("sets format to GraphQL", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql.graphql"),
      );
      expect(result.format).toBe(ESpecFormat.GraphQL);
    });

    it("detects violations", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql.graphql"),
      );
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("all violations have required fields", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql.graphql"),
      );
      for (const v of result.violations) {
        expect(v.ruleId).toBeTruthy();
        expect(v.message).toBeTruthy();
        expect(v.path).toBeTruthy();
        expect(Object.values(ESeverity)).toContain(v.severity);
      }
    });

    it("detects missing-type-description violations", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql.graphql"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-type-description");
    });

    it("detects missing-field-description violations", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql.graphql"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-field-description");
    });

    it("detects deprecated-without-reason violations", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql.graphql"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("deprecated-without-reason");
    });

    it("detects missing-enum-value-description violations", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql.graphql"),
      );
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-enum-value-description");
    });
  });

  describe("clean spec (sample-graphql-clean.graphql)", () => {
    it("returns passed: true", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql-clean.graphql"),
      );
      expect(result.passed).toBe(true);
    });

    it("returns zero violations", async () => {
      const result = await lintGraphQLSpec(
        path.join(examplesDir, "sample-graphql-clean.graphql"),
      );
      expect(result.violations).toHaveLength(0);
    });
  });
});
