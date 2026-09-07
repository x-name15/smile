import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ESeverity } from "../../models/index.js";
import { runOpenApiSmokeTest } from "../runtime/openapiTester.js";
import { runPostmanSmokeTest } from "../runtime/postmanTester.js";
import { runGraphQLSmokeTest } from "../runtime/graphqlTester.js";
import { runSmokeTest } from "../runtime/smokeTest.js";
import { DEFAULT_REQUEST_TIMEOUT_MS, fetchWithTimeout, resolveRequestTimeout } from "../runtime/request.js";

describe("OpenAPI smoke tests", () => {
  let temporaryDirectory: string | undefined;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

  it("Postman: forwards requestTimeoutMs so timed-out requests report endpoint-timeout", async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-postman-timeout-"));
    const collectionPath = join(temporaryDirectory, "collection.json");
    writeFileSync(collectionPath, JSON.stringify({
      info: { name: "Test", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
      item: [{
        name: "slow",
        request: { method: "GET", url: "http://localhost/slow" },
        response: [{ code: 200, body: '{}' }],
      }],
    }));

    vi.stubGlobal("fetch", vi.fn((_input: string | URL | Request, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })
    )));

    const result = await runPostmanSmokeTest(collectionPath, "http://localhost", undefined, 1);

    expect(result.endpoints[0]?.violations[0]?.ruleId).toBe("endpoint-timeout");
  });

  it("OpenAPI: accepts a 201 response when the spec documents 2XX as success", async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-wildcard-"));
    const specPath = join(temporaryDirectory, "api.json");
    writeFileSync(specPath, JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Wildcard API", version: "1.0.0" },
      paths: {
        "/items": {
          post: {
            responses: {
              "2XX": { description: "any success" },
            },
          },
        },
      },
    }));

    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 201 })));

    const result = await runOpenApiSmokeTest(specPath, "http://localhost");

    expect(result.endpoints[0]?.violations.filter((v) => v.ruleId === "unexpected-status-code")).toHaveLength(0);
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

  it("reports a distinct violation when a request times out", async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-timeout-"));
    const specPath = join(temporaryDirectory, "api.json");
    writeFileSync(specPath, JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Timeout API", version: "1.0.0" },
      paths: {
        "/health": {
          get: { responses: { "200": { description: "ok" } } },
        },
      },
    }));

    vi.stubGlobal("fetch", vi.fn((_input: string | URL | Request, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })
    )));

    const result = await runSmokeTest(
      specPath,
      "http://localhost",
      undefined,
      { requestTimeoutMs: 1 },
    );

    expect(result.endpoints[0]?.violations[0]?.ruleId).toBe("endpoint-timeout");
    expect(result.endpoints[0]?.violations[0]?.message).toContain("1ms");
  });

  it("aborts a request after the configured timeout", async () => {
    vi.stubGlobal("fetch", vi.fn((_input: string | URL | Request, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })
    )));

    await expect(fetchWithTimeout("http://localhost", {}, 1)).rejects.toThrow(
      "Request timed out after 1ms",
    );
  });

  it("falls back to 30 seconds for missing or invalid timeout values", () => {
    expect(resolveRequestTimeout()).toBe(DEFAULT_REQUEST_TIMEOUT_MS);
    expect(resolveRequestTimeout(0)).toBe(DEFAULT_REQUEST_TIMEOUT_MS);
    expect(resolveRequestTimeout(-1)).toBe(DEFAULT_REQUEST_TIMEOUT_MS);
    expect(resolveRequestTimeout(Number.NaN)).toBe(DEFAULT_REQUEST_TIMEOUT_MS);
  });

  describe("contract breaches (non-200 and schema mismatches)", () => {
    it("OpenAPI: fails smoke test when server responds with 500 Internal Server Error", async () => {
      temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-openapi-500-"));
      const specPath = join(temporaryDirectory, "api.json");
      writeFileSync(specPath, JSON.stringify({
        openapi: "3.0.0",
        info: { title: "Error API", version: "1.0.0" },
        paths: {
          "/users": {
            get: {
              responses: {
                "200": {
                  description: "success",
                  content: { "application/json": { schema: { type: "array" } } },
                },
              },
            },
          },
        },
      }));

      vi.stubGlobal("fetch", vi.fn(async () => new Response("Internal error", { status: 500 })));

      const result = await runOpenApiSmokeTest(specPath, "http://localhost");

      expect(result.passed).toBe(false);
      expect(result.endpoints[0]?.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "unexpected-status-code",
            severity: ESeverity.Error,
            message: "Expected status 200, got 500",
          }),
        ]),
      );
    });

    it("OpenAPI: fails smoke test when server responds with 200 but body violates schema", async () => {
      temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-openapi-mismatch-"));
      const specPath = join(temporaryDirectory, "api.json");
      writeFileSync(specPath, JSON.stringify({
        openapi: "3.0.0",
        info: { title: "Mismatch API", version: "1.0.0" },
        paths: {
          "/user": {
            get: {
              responses: {
                "200": {
                  description: "success",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: { id: { type: "number" }, name: { type: "string" } },
                        required: ["id", "name"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }));

      // Server returns id as string instead of number and misses required "name"
      vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "not-a-number" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })));

      const result = await runOpenApiSmokeTest(specPath, "http://localhost");

      expect(result.passed).toBe(false);
      const errors = result.endpoints[0]?.violations.filter((v) => v.severity === ESeverity.Error);
      expect(errors?.length).toBeGreaterThan(0);
      expect(errors?.some((v) => v.ruleId === "response-schema-mismatch")).toBe(true);
    });

    it("GraphQL: fails smoke test when server returns HTTP 500", async () => {
      temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-graphql-500-"));
      const specPath = join(temporaryDirectory, "schema.graphql");
      writeFileSync(specPath, "type Query { ping: String }\n");

      vi.stubGlobal("fetch", vi.fn(async () => new Response("Server error", { status: 500 })));

      const result = await runGraphQLSmokeTest(specPath, "http://localhost/graphql");

      expect(result.passed).toBe(false);
      expect(result.endpoints[0]?.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "unexpected-status-code",
            severity: ESeverity.Error,
            message: "Expected a successful 2xx response, got 500",
          }),
        ]),
      );
    });

    it("GraphQL: fails smoke test when server returns 200 with GraphQL errors array", async () => {
      temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-graphql-err-"));
      const specPath = join(temporaryDirectory, "schema.graphql");
      writeFileSync(specPath, "type Query { viewer: String }\n");

      vi.stubGlobal("fetch", vi.fn(async () => new Response(
        JSON.stringify({ errors: [{ message: "Unauthorized access to viewer" }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      )));

      const result = await runGraphQLSmokeTest(specPath, "http://localhost/graphql");

      expect(result.passed).toBe(false);
      expect(result.endpoints[0]?.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "graphql-response-errors",
            severity: ESeverity.Error,
            message: "GraphQL server returned errors: Unauthorized access to viewer",
          }),
        ]),
      );
    });

    it("Postman: fails smoke test when endpoint returns 404 instead of 200", async () => {
      temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-postman-404-"));
      const collectionPath = join(temporaryDirectory, "collection.json");
      writeFileSync(collectionPath, JSON.stringify({
        info: { name: "Test", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
        item: [{
          name: "getItem",
          request: { method: "GET", url: "http://localhost/items/123" },
          response: [{ code: 200, body: '{"id":123}' }],
        }],
      }));

      vi.stubGlobal("fetch", vi.fn(async () => new Response("Not Found", { status: 404 })));

      const result = await runPostmanSmokeTest(collectionPath, "http://localhost");

      expect(result.passed).toBe(false);
      expect(result.endpoints[0]?.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "unexpected-status-code",
            severity: ESeverity.Error,
            message: "Expected status 200, got 404",
          }),
        ]),
      );
    });

    it("Postman: fails smoke test when response body mismatches the example schema", async () => {
      temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-postman-body-mismatch-"));
      const collectionPath = join(temporaryDirectory, "collection.json");
      writeFileSync(collectionPath, JSON.stringify({
        info: { name: "Test", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
        item: [{
          name: "getConfig",
          request: { method: "GET", url: "http://localhost/config" },
          response: [{ code: 200, body: '{"enabled":true,"count":10}' }],
        }],
      }));

      // Server returns invalid types (enabled as string, count missing)
      vi.stubGlobal("fetch", vi.fn(async () => new Response(
        JSON.stringify({ enabled: "not-a-boolean" }),
        { status: 200, headers: { "content-type": "application/json" } },
      )));

      const result = await runPostmanSmokeTest(collectionPath, "http://localhost");

      expect(result.passed).toBe(false);
      expect(result.endpoints[0]?.violations.some((v) => v.ruleId === "response-schema-mismatch")).toBe(true);
    });
  });
});