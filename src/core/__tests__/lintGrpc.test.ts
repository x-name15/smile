import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lintGrpcSpec } from "../index.js";
import { ESpecFormat, ESeverity } from "../../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, "../../../fixtures");

describe("lintGrpcSpec", () => {
  describe("broken spec (sample-grpc.proto)", () => {
    it("returns passed: false", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc.proto"));
      expect(result.passed).toBe(false);
    });

    it("sets format to Grpc", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc.proto"));
      expect(result.format).toBe(ESpecFormat.Grpc);
    });

    it("detects violations", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc.proto"));
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("all violations have required fields", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc.proto"));
      for (const v of result.violations) {
        expect(v.ruleId).toBeTruthy();
        expect(v.message).toBeTruthy();
        expect(v.path).toBeTruthy();
        expect(Object.values(ESeverity)).toContain(v.severity);
      }
    });

    it("detects require-rpc-comments: only SayGoodbye (no comment), not SayHello (has one)", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc.proto"));
      const commentViolations = result.violations.filter(v => v.ruleId === "require-rpc-comments");
      expect(commentViolations).toHaveLength(1);
      expect(commentViolations[0].message).toContain("SayGoodbye");
    });

    it("detects pascal-case-messages: goodbyeRequest is not PascalCase", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc.proto"));
      const pascalViolation = result.violations.find(v => v.ruleId === "pascal-case-messages");
      expect(pascalViolation).toBeDefined();
      expect(pascalViolation?.message).toContain("goodbyeRequest");
    });

    it("detects camel-case-fields: Name_bad is not camelCase", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc.proto"));
      const camelViolation = result.violations.find(v => v.ruleId === "camel-case-fields");
      expect(camelViolation).toBeDefined();
      expect(camelViolation?.message).toContain("Name_bad");
    });
  });

  describe("clean spec (sample-grpc-clean.proto)", () => {
    it("returns passed: true", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc-clean.proto"));
      expect(result.passed).toBe(true);
    });

    it("returns zero violations", async () => {
      const result = await lintGrpcSpec(path.join(fixturesDir, "sample-grpc-clean.proto"));
      expect(result.violations).toHaveLength(0);
    });
  });
});
