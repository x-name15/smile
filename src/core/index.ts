import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import type { DocumentNode } from "graphql";
import type protobuf from "protobufjs";

import { parseOpenApiSpec } from "../parsers/openapi.js";
import { parseAsyncApiSpec } from "../parsers/asyncapi.js";
import { parseJsonSchemaSpec } from "../parsers/jsonschema.js";
import { parseGraphQLSpec } from "../parsers/graphql.js";
import { parseGrpcSpec } from "../parsers/grpc.js";
import { parsePostmanSpec } from "../parsers/postman.js";

import { openApiRules } from "./rules/openapi/index.js";
import { asyncApiRules } from "./rules/asyncapi/index.js";
import { jsonSchemaRules } from "./rules/jsonschema/index.js";
import { graphqlRules } from "./rules/graphql/index.js";
import { grpcRules } from "./rules/grpc/index.js";
import { postmanRules } from "./rules/postman/index.js";

import { detectSpecFormat } from "./detectSpecFormat.js";
import { ESpecFormat, ESeverity, type ILintResult, type ISmileConfig, type IPostmanCollection } from "../models/index.js";
import { loadPlugins, evaluateCustomRules } from "./pluginLoader.js";

export * from "../models/index.js";
export * from "./detectSpecFormat.js";
export * from "./runtime/validateResponse.js";
export * from "./bundler.js";
export * from "./config.js";
export { runSmokeTest } from "./runtime/smokeTest.js";
export { detectSpecFormat } from "./detectSpecFormat.js";
export { lintOpenApiSpec, lintAsyncApiSpec, lintJsonSchemaSpec, lintGraphQLSpec, lintGrpcSpec, lintPostmanSpec, lintSpec };

/**
 * Parses and lints an OpenAPI spec file, running all active rules
 * against it and returning a structured result.
 */
async function lintOpenApiSpec(sourcePath: string, config: ISmileConfig = {}): Promise<ILintResult> {
  const parsed = await parseOpenApiSpec(sourcePath);
  const doc = parsed.raw as OpenAPIV3.Document | OpenAPIV3_1.Document;

  const rawViolations = openApiRules.flatMap((rule) => rule(doc));
  
  const customRules = await loadPlugins(config.plugins);
  rawViolations.push(...evaluateCustomRules(doc, ESpecFormat.OpenApi, customRules));

  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config, ESpecFormat.OpenApi, sourcePath);

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
  
  const customRules = await loadPlugins(config.plugins);
  rawViolations.push(...evaluateCustomRules(doc, ESpecFormat.AsyncApi, customRules));

  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config, ESpecFormat.AsyncApi, sourcePath);

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
  
  const customRules = await loadPlugins(config.plugins);
  rawViolations.push(...evaluateCustomRules(doc, ESpecFormat.JsonSchema, customRules));

  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config, ESpecFormat.JsonSchema, sourcePath);

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
  
  const customRules = await loadPlugins(config.plugins);
  rawViolations.push(...evaluateCustomRules(doc, ESpecFormat.GraphQL, customRules));

  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config, ESpecFormat.GraphQL, sourcePath);

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
    case ESpecFormat.Grpc:
      return lintGrpcSpec(sourcePath, config);
    case ESpecFormat.Postman:
      return lintPostmanSpec(sourcePath, config);
    case ESpecFormat.Unknown:
      return {
        format: ESpecFormat.Unknown,
        passed: false,
        violations: [{
          ruleId: "unknown-spec-format",
          severity: ESeverity.Error,
          message: `Could not detect the spec format of "${sourcePath}". Supported formats: OpenAPI (.yaml/.json), AsyncAPI (.yaml/.json), JSON Schema (.json), GraphQL (.graphql/.gql), gRPC (.proto), Postman Collection (.json).`,
          path: sourcePath,
        }],
        sourcePath,
      };
    default:
      return lintOpenApiSpec(sourcePath, config);
  }
}

/**
 * Parses and lints a gRPC (.proto) file, running all active rules
 * against it and returning a structured result.
 */
async function lintGrpcSpec(sourcePath: string, config: ISmileConfig = {}): Promise<ILintResult> {
  const parsed = await parseGrpcSpec(sourcePath);
  const doc = parsed.raw as protobuf.Root;

  const rawViolations = grpcRules.flatMap((rule) => rule(doc));
  
  const customRules = await loadPlugins(config.plugins);
  rawViolations.push(...evaluateCustomRules(doc, ESpecFormat.Grpc, customRules));

  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config, ESpecFormat.Grpc, sourcePath);

  return {
    format: ESpecFormat.Grpc,
    passed: !violations.some(v => v.severity === ESeverity.Error),
    violations,
    sourcePath,
  };
}

/**
 * Parses and lints a Postman Collection JSON file, running all active rules
 * against it and returning a structured result.
 */
async function lintPostmanSpec(sourcePath: string, config: ISmileConfig = {}): Promise<ILintResult> {
  const parsed = await parsePostmanSpec(sourcePath);
  const doc = parsed.raw as IPostmanCollection;

  const rawViolations = postmanRules.flatMap((rule) => rule(doc));
  
  const customRules = await loadPlugins(config.plugins);
  rawViolations.push(...evaluateCustomRules(doc, ESpecFormat.Postman, customRules));

  const { applyConfigToViolations } = await import("./config.js");
  const violations = applyConfigToViolations(rawViolations, config, ESpecFormat.Postman, sourcePath);

  return {
    format: ESpecFormat.Postman,
    passed: !violations.some(v => v.severity === ESeverity.Error),
    violations,
    sourcePath,
  };
}