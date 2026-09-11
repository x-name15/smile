import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { generateCanonicalOperationId, generateCanonicalSummary, fixSpecFile } from "../index.js";
import { lintOpenApiSpec } from "../../index.js";

describe("Conservative Autofix Engine", () => {
  it("generates deterministic camelCase operationIds from method and path", () => {
    expect(generateCanonicalOperationId("get", "/users")).toBe("getUsers");
    expect(generateCanonicalOperationId("post", "/api/v1/orders")).toBe("postApiV1Orders");
    expect(generateCanonicalOperationId("get", "/users/{id}")).toBe("getUsersById");
    expect(generateCanonicalOperationId("delete", "/teams/{team_id}/members/{user_id}")).toBe(
      "deleteTeamsByTeamIdMembersByUserId"
    );
  });

  it("generates human-readable summaries", () => {
    expect(generateCanonicalSummary("get", "/users")).toBe("Get /users");
    expect(generateCanonicalSummary("post", "/users/{id}")).toBe("Post /users/:id");
  });

  it("fixes missing-operation-id and missing-summary in YAML while preserving comments", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smile-fix-"));
    const yamlPath = path.join(tempDir, "spec.yaml");

    const originalYaml = `openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
paths:
  # Crucial endpoint for fetching accounts
  /accounts/{accountId}:
    get:
      responses:
        "200":
          description: OK
`;

    fs.writeFileSync(yamlPath, originalYaml, "utf-8");

    // Before fix: should trigger missing-operation-id and missing-summary
    const beforeResult = await lintOpenApiSpec(yamlPath);
    expect(beforeResult.violations.some(v => v.ruleId === "missing-operation-id")).toBe(true);
    expect(beforeResult.violations.some(v => v.ruleId === "missing-summary")).toBe(true);

    // Apply autofix
    const fixResult = fixSpecFile(yamlPath);
    expect(fixResult.fixedCount).toBe(2);
    expect(fixResult.changes).toHaveLength(2);

    const updatedYaml = fs.readFileSync(yamlPath, "utf-8");

    // Verify comment is preserved!
    expect(updatedYaml).toContain("# Crucial endpoint for fetching accounts");
    expect(updatedYaml).toContain("operationId: getAccountsByAccountId");
    expect(updatedYaml).toContain("summary: Get /accounts/:accountId");

    // After fix: no missing-operation-id or missing-summary
    const afterResult = await lintOpenApiSpec(yamlPath);
    expect(afterResult.violations.some(v => v.ruleId === "missing-operation-id")).toBe(false);
    expect(afterResult.violations.some(v => v.ruleId === "missing-summary")).toBe(false);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("fixes missing-operation-id in JSON files", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smile-fix-json-"));
    const jsonPath = path.join(tempDir, "spec.json");

    const originalJson = {
      openapi: "3.0.0",
      info: { title: "JSON API", version: "1.0.0" },
      paths: {
        "/items": {
          get: {
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };

    fs.writeFileSync(jsonPath, JSON.stringify(originalJson, null, 2), "utf-8");

    const fixResult = fixSpecFile(jsonPath);
    expect(fixResult.fixedCount).toBe(2); // operationId + summary

    const updated = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    expect(updated.paths["/items"].get.operationId).toBe("getItems");
    expect(updated.paths["/items"].get.summary).toBe("Get /items");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
