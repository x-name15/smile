import { describe, it, expect } from "vitest";
import path from "node:path";
import { detectSpecFormat } from "../detectSpecFormat.js";
import { ESpecFormat } from "../../models/index.js";

const fixturesDir = path.resolve(__dirname, "../../../fixtures");

describe("detectSpecFormat", () => {
  it("detects an OpenAPI spec by its openapi key", () => {
    const result = detectSpecFormat(path.join(fixturesDir, "sample-openapi.yaml"));
    expect(result).toBe(ESpecFormat.OpenApi);
  });

  it("detects an OpenAPI clean spec", () => {
    const result = detectSpecFormat(
      path.join(fixturesDir, "sample-openapi-clean.yaml"),
    );
    expect(result).toBe(ESpecFormat.OpenApi);
  });

  it("detects an AsyncAPI spec by its asyncapi key", () => {
    const result = detectSpecFormat(
      path.join(fixturesDir, "sample-asyncapi.yaml"),
    );
    expect(result).toBe(ESpecFormat.AsyncApi);
  });

  it("detects an AsyncAPI clean spec", () => {
    const result = detectSpecFormat(
      path.join(fixturesDir, "sample-asyncapi-clean.yaml"),
    );
    expect(result).toBe(ESpecFormat.AsyncApi);
  });

  it("detects a JSON Schema by its $schema key", () => {
    const result = detectSpecFormat(
      path.join(fixturesDir, "sample-jsonschema.json"),
    );
    expect(result).toBe(ESpecFormat.JsonSchema);
  });

  it("detects a clean JSON Schema by its $schema key", () => {
    const result = detectSpecFormat(
      path.join(fixturesDir, "sample-jsonschema-clean.json"),
    );
    expect(result).toBe(ESpecFormat.JsonSchema);
  });

  it("detects a GraphQL SDL by its .graphql extension", () => {
    const result = detectSpecFormat(
      path.join(fixturesDir, "sample-graphql.graphql"),
    );
    expect(result).toBe(ESpecFormat.GraphQL);
  });

  it("detects a clean GraphQL SDL by its .graphql extension", () => {
    expect(detectSpecFormat(path.join(fixturesDir, "sample-graphql-clean.graphql"))).toBe(ESpecFormat.GraphQL);
  });

  it("should correctly identify a gRPC specification", () => {
    expect(detectSpecFormat(path.join(fixturesDir, "sample-grpc.proto"))).toBe(ESpecFormat.Grpc);
  });

  it("should correctly identify a Postman Collection", () => {
    expect(detectSpecFormat(path.join(fixturesDir, "sample-postman.json"))).toBe(ESpecFormat.Postman);
  });
});
