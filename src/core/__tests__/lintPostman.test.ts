import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lintPostmanSpec } from "../index.js";
import { ESpecFormat, ESeverity } from "../../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, "../../../fixtures");

describe("lintPostmanSpec", () => {
  describe("broken spec (sample-postman.json)", () => {
    it("returns passed: false", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman.json"));
      expect(result.passed).toBe(false);
    });

    it("sets format to Postman", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman.json"));
      expect(result.format).toBe(ESpecFormat.Postman);
    });

    it("detects violations", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman.json"));
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("all violations have required fields", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman.json"));
      for (const v of result.violations) {
        expect(v.ruleId).toBeTruthy();
        expect(v.message).toBeTruthy();
        expect(v.path).toBeTruthy();
        expect(Object.values(ESeverity)).toContain(v.severity);
      }
    });

    it("detects require-request-description: the request with no description", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman.json"));
      const violation = result.violations.find(v => v.ruleId === "require-request-description");
      expect(violation).toBeDefined();
      expect(violation?.message).toContain("Missing Description and Responses");
    });

    it("detects require-response-example: the request with empty response array", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman.json"));
      const violation = result.violations.find(v => v.ruleId === "require-response-example");
      expect(violation).toBeDefined();
      expect(violation?.message).toContain("Missing Description and Responses");
    });

    it("detects no-empty-folders with Warning severity", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman.json"));
      const violation = result.violations.find(v => v.ruleId === "no-empty-folders");
      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(ESeverity.Warning);
      expect(violation?.message).toContain("Empty Folder");
    });

    it("does NOT flag the well-formed request (Get Users)", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman.json"));
      const descViolations = result.violations.filter(v => v.ruleId === "require-request-description");
      const flaggedNames = descViolations.map(v => v.message);
      expect(flaggedNames.some(m => m.includes("Get Users"))).toBe(false);
    });
  });

  describe("clean spec (sample-postman-clean.json)", () => {
    it("returns passed: true", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman-clean.json"));
      expect(result.passed).toBe(true);
    });

    it("returns zero violations", async () => {
      const result = await lintPostmanSpec(path.join(fixturesDir, "sample-postman-clean.json"));
      expect(result.violations).toHaveLength(0);
    });
  });
});
