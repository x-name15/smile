import { readFileSync } from "node:fs";
import { ESpecFormat } from "../models/index.js";

/**
 * Detects the spec format of a file by checking its extension and/or
 * top-level keys. Order matters: check extension first (unambiguous),
 * then fall through to content-based detection.
 */
export function detectSpecFormat(sourcePath: string): ESpecFormat {
  // GraphQL: extension-based — most reliable, no content ambiguity
  if (/\.(graphql|gql)$/i.test(sourcePath)) {
    return ESpecFormat.GraphQL;
  }

  // gRPC: extension-based
  if (/\.proto$/i.test(sourcePath)) {
    return ESpecFormat.Grpc;
  }

  const contents = readFileSync(sourcePath, "utf-8");

  // Postman Collections: check for postman schema URL in JSON
  if (/https?:\/\/schema\.getpostman\.com\/json\/collection/i.test(contents)) {
    return ESpecFormat.Postman;
  }

  // AsyncAPI: top-level `asyncapi` key
  if (/^asyncapi\s*:/m.test(contents) || /"asyncapi"\s*:/.test(contents)) {
    return ESpecFormat.AsyncApi;
  }

  // JSON Schema: `$schema` field pointing to a JSON Schema URL
  if (/"\$schema"\s*:/.test(contents) || /^\$schema\s*:/m.test(contents)) {
    return ESpecFormat.JsonSchema;
  }

  // OpenAPI: top-level `openapi` or `swagger` key
  if (/^openapi\s*:/m.test(contents) || /^swagger\s*:/m.test(contents) || /"openapi"\s*:/.test(contents) || /"swagger"\s*:/.test(contents)) {
    return ESpecFormat.OpenApi;
  }

  // Could not determine the format — return Unknown instead of silently
  // treating the file as OpenAPI, which would produce confusing parse errors.
  return ESpecFormat.Unknown;
}