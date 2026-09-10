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
  const schemaMatch = contents.match(/"schema"\s*:\s*"([^"]+)"/i);
  if (schemaMatch && /^https?:\/\/schema\.getpostman\.com\/json\/collection/i.test(schemaMatch[1])) {
    return ESpecFormat.Postman;
  }

  // AsyncAPI: top-level `asyncapi` key
  if (/^asyncapi\s*:/m.test(contents) || /"asyncapi"\s*:/.test(contents)) {
    return ESpecFormat.AsyncApi;
  }

  // JSON Schema: `$schema` field pointing to an official JSON Schema dialect URL,
  // or a file explicitly named with a `.schema.json` / `.schema.yaml` pattern.
  const jsonSchemaMatch = contents.match(/"\$schema"\s*:\s*"([^"]+)"/i) || contents.match(/^\$schema\s*:\s*["']?([^\s"']+)["']?/m);
  if (jsonSchemaMatch) {
    const schemaUrl = jsonSchemaMatch[1];
    if (/^https?:\/\/json-schema\.org\//i.test(schemaUrl)) {
      return ESpecFormat.JsonSchema;
    }
  }
  if (/\.schema\.(json|ya?ml)$/i.test(sourcePath)) {
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