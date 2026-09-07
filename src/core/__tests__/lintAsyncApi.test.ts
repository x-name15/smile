import { describe, it, expect } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  describe("broken spec v3 (sample-asyncapi-v3.yaml)", () => {
    it("returns passed: false", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi-v3.yaml"));
      expect(result.passed).toBe(false);
    });

    it("sets format to AsyncApi", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi-v3.yaml"));
      expect(result.format).toBe(ESpecFormat.AsyncApi);
    });

    it("detects missing-channel-description in v3 channels", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi-v3.yaml"));
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-channel-description");
      expect(result.violations.some((v) => v.path === "channels.userSignedUp.description")).toBe(true);
    });

    it("detects missing-message in v3 operations", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi-v3.yaml"));
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-message");
      expect(result.violations.some((v) => v.path === "operations.onOrderCreated.messages")).toBe(true);
    });

    it("detects missing-message-description in v3 channel messages", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi-v3.yaml"));
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("missing-message-description");
      expect(result.violations.some((v) => v.path === "channels.userSignedUp.messages.userSignedUpMessage.description")).toBe(true);
    });

    it("detects untyped-schema-property in v3 payloads", async () => {
      const result = await lintAsyncApiSpec(path.join(fixturesDir, "sample-asyncapi-v3.yaml"));
      const ruleIds = result.violations.map((v) => v.ruleId);
      expect(ruleIds).toContain("untyped-schema-property");
      expect(result.violations.some((v) => v.path.includes("userId"))).toBe(true);
    });

    it("detects missing-operation-id when v3 spec defines channels but no operations", async () => {
      const tempDir = mkdtempSync(join(tmpdir(), "smile-v3-no-op-"));
      const specFile = join(tempDir, "asyncapi.yaml");
      writeFileSync(
        specFile,
        'asyncapi: "3.0.0"\ninfo:\n  title: No Op API\n  version: "1.0.0"\nchannels:\n  c1:\n    address: c1\n    description: test channel\noperations: {}\n',
      );
      try {
        const result = await lintAsyncApiSpec(specFile);
        expect(result.violations.some((v) => v.ruleId === "missing-operation-id")).toBe(true);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("clean spec v3 (sample-asyncapi-v3-clean.yaml)", () => {
    it("returns passed: true with 0 violations for a valid AsyncAPI 3.x document", async () => {
      const result = await lintAsyncApiSpec(
        path.join(fixturesDir, "sample-asyncapi-v3-clean.yaml"),
      );
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});
