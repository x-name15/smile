import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import type { DocumentNode } from "graphql";
import { parseOpenApiSpec } from "../parsers/openapi.js";
import { parseAsyncApiSpec } from "../parsers/asyncapi.js";
import { parseJsonSchemaSpec } from "../parsers/jsonschema.js";
import { parseGraphQLSpec } from "../parsers/graphql.js";
import { openApiRules } from "./rules/openapi/index.js";
import { asyncApiRules } from "./rules/asyncapi/index.js";
import { jsonSchemaRules } from "./rules/jsonschema/index.js";
import { graphqlRules } from "./rules/graphql/index.js";
import { detectSpecFormat } from "./detectSpecFormat.js";
import { ESpecFormat, ESeverity, type ILintResult, type ISmileConfig } from "../models/index.js";

export * from "../models/index.js";
export * from "./detectSpecFormat.js";
export * from "./runtime/validateResponse.js";
export * from "./bundler.js";
export * from "./config.js";
export { runSmokeTest } from "./runtime/smokeTest.js";
export { detectSpecFormat } from "./detectSpecFormat.js";
export { lintOpenApiSpec, lintAsyncApiSpec, lintJsonSchemaSpec, lintGraphQLSpec, lintSpec };

/**
 * Parses and lints an OpenAPI spec file, running all active rules
 * against it and returning a structured result.
 */
async function lintOpenApiSpec(sourcePath: string, config: ISmileConfig = {}): Promise<ILintResult> {
  const parsed = await parseOpenApiSpec(sourcePath);
  const doc = parsed.raw as OpenAPIV3.Document | OpenAPIV3_1.Document;

  const rawViolations = openApiRules.flatMap((rule) => rule(doc));
  
  // Use the newly exported applyConfigToViolations
  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config);

  return {
    format: ESpecFormat.OpenApi,
    passed: !violations.some(v => v.severity === ESeverity.Error),
    violations,
    sourcePath,
  };
}

/**
 * Parses and lints an AsyncAPI spec file, running all active rules
 * against it and returning a structured result.
 */
async function lintAsyncApiSpec(sourcePath: string, config: ISmileConfig = {}): Promise<ILintResult> {
  const parsed = await parseAsyncApiSpec(sourcePath);
  const doc = parsed.raw as Record<string, unknown>;

  const rawViolations = asyncApiRules.flatMap((rule) => rule(doc));
  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config);

  return {
    format: ESpecFormat.AsyncApi,
    passed: !violations.some(v => v.severity === ESeverity.Error),
    violations,
    sourcePath,
  };
}

/**
 * Parses and lints a JSON Schema file, running all active rules
 * against it and returning a structured result.
 */
async function lintJsonSchemaSpec(sourcePath: string, config: ISmileConfig = {}): Promise<ILintResult> {
  const parsed = await parseJsonSchemaSpec(sourcePath);
  const doc = parsed.raw as Record<string, unknown>;

  const rawViolations = jsonSchemaRules.flatMap((rule) => rule(doc));
  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config);

  return {
    format: ESpecFormat.JsonSchema,
    passed: !violations.some(v => v.severity === ESeverity.Error),
    violations,
    sourcePath,
  };
}

/**
 * Parses and lints a GraphQL SDL file, running all active rules
 * against it and returning a structured result.
 */
async function lintGraphQLSpec(sourcePath: string, config: ISmileConfig = {}): Promise<ILintResult> {
  const parsed = await parseGraphQLSpec(sourcePath);
  const doc = parsed.raw as DocumentNode;

  const rawViolations = graphqlRules.flatMap((rule) => rule(doc));
  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config);

  return {
    format: ESpecFormat.GraphQL,
    passed: !violations.some(v => v.severity === ESeverity.Error),
    violations,
    sourcePath,
  };
}

/**
 * Lints a spec file regardless of format — auto-detects OpenAPI, AsyncAPI,
 * JSON Schema, or GraphQL SDL and dispatches to the right linter.
 * This is what `smile lint <file>` uses — it just works for all formats.
 */
async function lintSpec(sourcePath: string, config: ISmileConfig = {}): Promise<ILintResult> {
  const format = detectSpecFormat(sourcePath);

  switch (format) {
    case ESpecFormat.AsyncApi:
      return lintAsyncApiSpec(sourcePath, config);
    case ESpecFormat.JsonSchema:
      return lintJsonSchemaSpec(sourcePath, config);
    case ESpecFormat.GraphQL:
      return lintGraphQLSpec(sourcePath, config);
    default:
      return lintOpenApiSpec(sourcePath, config);
  }
}