import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ESeverity } from "../../models/index.js";
import { runOpenApiSmokeTest } from "../runtime/openapiTester.js";
import { runPostmanSmokeTest } from "../runtime/postmanTester.js";
import { runGraphQLSmokeTest } from "../runtime/graphqlTester.js";

describe("OpenAPI smoke tests", () => {
  let temporaryDirectory: string | undefined;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it("uses path-level parameters and validates non-JSON responses as text", async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-runtime-"));
    const specPath = join(temporaryDirectory, "api.json");
    writeFileSync(specPath, JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {
        "/users/{id}": {
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "ada" } }],
          get: {
            responses: {
              "200": {
                description: "ok",
                content: { "text/plain": { schema: { type: "string" } } },
              },
            },
          },
        },
      },
    }));

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      expect(String(input)).toBe("http://localhost/users/ada");
      return new Response("hello", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runOpenApiSmokeTest(specPath, "http://localhost");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.passed).toBe(true);
    expect(result.endpoints[0]?.violations.filter((v) => v.severity === ESeverity.Error)).toHaveLength(0);
  });

  it("preserves absolute URLs in Postman collections", async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-postman-"));
    const collectionPath = join(temporaryDirectory, "collection.json");
    writeFileSync(collectionPath, JSON.stringify({
      info: { name: "Test", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
      item: [{
        name: "health",
        request: { method: "GET", url: "https://api.example.test/health" },
        response: [{ code: 200, body: '{"ok":true}' }],
      }],
    }));

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      expect(String(input)).toBe("https://api.example.test/health");
      return new Response('{"ok":true}', {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runPostmanSmokeTest(collectionPath, "http://localhost");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.passed).toBe(true);
  });

  it("tests fields from a custom GraphQL query root", async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-graphql-"));
    const specPath = join(temporaryDirectory, "schema.graphql");
    writeFileSync(specPath, "schema { query: RootQuery } type RootQuery { health: String }\n");

    const fetchMock = vi.fn(async () => new Response('{"data":{"health":"ok"}}', {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runGraphQLSmokeTest(specPath, "http://localhost/graphql");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.endpoints).toHaveLength(1);
    expect(result.passed).toBe(true);
  });
});