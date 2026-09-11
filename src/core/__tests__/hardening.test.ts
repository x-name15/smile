import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { lintSpec, lintOpenApiSpec, lintAsyncApiSpec, lintGraphQLSpec, lintJsonSchemaSpec, applyConfigToViolations } from "../index.js";
import { ESeverity, ESpecFormat } from "../../models/index.js";

const fixturesDir = path.resolve(__dirname, "../../../fixtures");

describe("Pipeline Hardening & Crash Resilience", () => {
  it("handles completely invalid YAML syntax gracefully without crashing", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smile-test-"));
    const badYamlPath = path.join(tempDir, "broken.yaml");
    fs.writeFileSync(badYamlPath, "openapi: 3.0.0\ninfo:\n  title: Broken\n  version: [unclosed array\npaths:\n  /test:\n");

    const result = await lintSpec(badYamlPath);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].ruleId).toBe("malformed-spec");
    expect(result.violations[0].severity).toBe(ESeverity.Error);
    expect(result.violations[0].path).toBe(badYamlPath);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("handles non-existent file path gracefully without crashing", async () => {
    const nonExistentPath = path.join(fixturesDir, "this-file-does-not-exist.yaml");
    const result = await lintSpec(nonExistentPath);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].ruleId).toBe("malformed-spec");
    expect(result.violations[0].severity).toBe(ESeverity.Error);
  });

  it("handles invalid JSON Schema file without crashing", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smile-test-"));
    const badJsonPath = path.join(tempDir, "invalid.schema.json");
    fs.writeFileSync(badJsonPath, '{"$schema": "https://json-schema.org/draft/2020-12/schema", "type": ');

    const result = await lintJsonSchemaSpec(badJsonPath);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].ruleId).toBe("malformed-spec");
    expect(result.violations[0].severity).toBe(ESeverity.Error);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("handles invalid GraphQL syntax without crashing", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smile-test-"));
    const badGqlPath = path.join(tempDir, "broken.graphql");
    fs.writeFileSync(badGqlPath, "type Query { broken syntax ::: ");

    const result = await lintGraphQLSpec(badGqlPath);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].ruleId).toBe("malformed-spec");
    expect(result.violations[0].severity).toBe(ESeverity.Error);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("handles invalid AsyncAPI syntax without crashing", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smile-test-"));
    const badAsyncApiPath = path.join(tempDir, "broken-asyncapi.yaml");
    fs.writeFileSync(badAsyncApiPath, "asyncapi: '2.6.0'\ninfo:\n  title: Broken\n  version: 1.0.0\nchannels: { not: valid: yaml ");

    const result = await lintAsyncApiSpec(badAsyncApiPath);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].ruleId).toBe("malformed-spec");
    expect(result.violations[0].severity).toBe(ESeverity.Error);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("allows multi-file batch execution to complete even when one file is corrupted", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smile-test-"));
    const badYamlPath = path.join(tempDir, "corrupted.yaml");
    fs.writeFileSync(badYamlPath, "openapi: 3.0.0\nbad: [unclosed");

    const cleanSpecPath = path.join(fixturesDir, "sample-openapi-clean.yaml");

    // Simulate CLI Promise.all directory linting
    const files = [cleanSpecPath, badYamlPath];
    const results = await Promise.all(files.map(f => lintSpec(f)));

    expect(results).toHaveLength(2);

    const cleanResult = results.find(r => r.sourcePath === cleanSpecPath);
    const brokenResult = results.find(r => r.sourcePath === badYamlPath);

    expect(cleanResult).toBeDefined();
    expect(cleanResult?.passed).toBe(true);
    expect(cleanResult?.violations).toHaveLength(0);

    expect(brokenResult).toBeDefined();
    expect(brokenResult?.passed).toBe(false);
    expect(brokenResult?.violations[0].ruleId).toBe("malformed-spec");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("skips disk reading and YAML AST parsing when violations array is empty in applyConfigToViolations", () => {
    const readSpy = vi.spyOn(fs, "readFileSync");

    const result = applyConfigToViolations([], {}, ESpecFormat.OpenApi, "dummy.yaml");

    expect(result).toEqual([]);
    expect(readSpy).not.toHaveBeenCalled();

    readSpy.mockRestore();
  });
});