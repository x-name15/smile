import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { parseOpenApiSpec } from "../../parsers/openapi.js";
import { validateResponseAgainstSchema } from "./validateResponse.js";
import {
  ESeverity,
  ESpecFormat,
  type IEndpointTestResult,
  type ITestResult,
  type IViolation,
} from "../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
type TParameter = OpenAPIV3.ParameterObject;
type TOperation = OpenAPIV3.OperationObject & { parameters?: TParameter[] };

const AUTO_TESTABLE_METHODS = ["get", "post", "put", "patch", "delete"];

/**
 * Attempts to build a concrete URL for a path template (e.g. "/users/{id}")
 * using each path parameter's `example` or `schema.default`. Returns null
 * if any required path parameter has no usable example value.
 */
function buildConcreteUrl(
  baseUrl: string,
  pathTemplate: string,
  parameters: TParameter[],
): string | null {
  let resolvedPath = pathTemplate;
  const pathParams = parameters.filter((param) => param.in === "path");

  for (const param of pathParams) {
    const schema = param.schema as { example?: unknown; default?: unknown } | undefined;
    const exampleValue = param.example ?? schema?.example ?? schema?.default;

    if (exampleValue === undefined) {
      return null;
    }

    resolvedPath = resolvedPath.replace(
      `{${param.name}}`,
      encodeURIComponent(String(exampleValue)),
    );
  }

  const trimmedBase = baseUrl.replace(/\/$/, "");
  return `${trimmedBase}${resolvedPath}`;
}

/**
 * Picks the first documented 2xx response, since that's what a
 * successful request should return.
 */
function findExpectedSuccessResponse(
  operation: TOperation,
): { statusCode: string; schema: unknown; mediaType: string } | null {
  const responses = operation.responses ?? {};

  for (const [statusCode, responseObj] of Object.entries(responses)) {
    if (!statusCode.startsWith("2")) continue;
    const response = responseObj as OpenAPIV3.ResponseObject;
    if (!response.content) return { statusCode, schema: undefined, mediaType: "" };

    for (const mediaType of ["application/vnd.api+json", "application/hal+json", "application/json"]) {
      if (response.content[mediaType]) {
        return { statusCode, schema: response.content[mediaType].schema, mediaType };
      }
    }
    
    // Fallback to the first available media type
    const firstMedia = Object.keys(response.content)[0];
    if (firstMedia) {
      return { statusCode, schema: response.content[firstMedia].schema, mediaType: firstMedia };
    }
  }

  return null;
}

/**
 * Generates dummy data based on a JSON schema.
 * Very simple generator for smoke testing purposes.
 */
function generateFakeData(schema: any, doc: TOpenApi3Doc): any {
  if (!schema) return undefined;
  
  // Resolve simple internal refs (very naive resolution for smoke tests)
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/components/schemas/', '');
    const resolved = doc.components?.schemas?.[refPath];
    if (resolved) {
      return generateFakeData(resolved, doc);
    }
    return {};
  }

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  switch (schema.type) {
    case "string":
      return "test-string";
    case "number":
    case "integer":
      return 123;
    case "boolean":
      return true;
    case "array":
      if (schema.items) {
        return [generateFakeData(schema.items, doc)];
      }
      return [];
    case "object":
    default:
      const obj: any = {};
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          obj[key] = generateFakeData(propSchema, doc);
        }
      }
      return obj;
  }
}

/**
 * Extracts or generates a valid JSON body for POST/PUT/PATCH methods.
 */
function getRequestBody(operation: TOperation, doc: TOpenApi3Doc): any {
  const reqBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
  if (!reqBody || !reqBody.content || !reqBody.content["application/json"]) {
    return undefined;
  }
  const schema = reqBody.content["application/json"].schema;
  return generateFakeData(schema, doc);
}

/**
 * Tests a single operation against a live server.
 */
async function testOperation(
  baseUrl: string,
  pathTemplate: string,
  method: string,
  operation: TOperation,
  doc: TOpenApi3Doc,
  headers?: Record<string, string>,
): Promise<IEndpointTestResult> {
  const upperMethod = method.toUpperCase();
  const label = `${upperMethod} ${pathTemplate}`;
  const parameters = operation.parameters ?? [];
  const url = buildConcreteUrl(baseUrl, pathTemplate, parameters);

  if (url === null) {
    return {
      method: upperMethod,
      path: pathTemplate,
      violations: [],
      skipped: true,
      skipReason: "One or more path parameters have no example/default value",
    };
  }

  const expected = findExpectedSuccessResponse(operation);
  if (expected === null) {
    return {
      method: upperMethod,
      path: pathTemplate,
      violations: [],
      skipped: true,
      skipReason: "No documented 2xx response to compare against",
    };
  }

  let bodyData: any = undefined;
  if (["post", "put", "patch"].includes(method)) {
    bodyData = getRequestBody(operation, doc);
  }

  const fetchOptions: RequestInit = {
    method: upperMethod,
    headers: {
      ...headers,
      ...(bodyData !== undefined ? { "Content-Type": "application/json" } : {}),
    },
  };
  
  if (bodyData !== undefined) {
    fetchOptions.body = JSON.stringify(bodyData);
  }

  let response: Response;
  try {
    response = await fetch(new URL(url).toString(), fetchOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      method: upperMethod,
      path: pathTemplate,
      skipped: false,
      violations: [
        {
          ruleId: "endpoint-unreachable",
          severity: ESeverity.Error,
          message: `Could not reach ${url}: ${message}`,
          path: label,
        },
      ],
    };
  }

  const violations: IViolation[] = [];
  if (String(response.status) !== expected.statusCode) {
    violations.push({
      ruleId: "unexpected-status-code",
      severity: ESeverity.Error,
      message: `Expected status ${expected.statusCode}, got ${response.status}`,
      path: label,
    });
  } else {
    const resBody: unknown = await response.json().catch(() => undefined);
    const actualMediaType = response.headers.get("content-type")?.split(";")[0]?.trim() || expected.mediaType;
    violations.push(...validateResponseAgainstSchema(expected.schema, resBody, label, actualMediaType));
  }

  return {
    method: upperMethod,
    path: pathTemplate,
    violations,
    skipped: false,
  };
}

export async function runOpenApiSmokeTest(
  sourcePath: string,
  baseUrl: string,
  headers?: Record<string, string>,
): Promise<ITestResult> {
  const parsed = await parseOpenApiSpec(sourcePath);
  const doc = parsed.raw as TOpenApi3Doc;
  const paths = doc.paths ?? {};
  const endpoints: IEndpointTestResult[] = [];

  for (const [pathTemplate, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of AUTO_TESTABLE_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as TOperation | undefined;
      if (!operation) continue;

      endpoints.push(
        await testOperation(baseUrl, pathTemplate, method, operation, doc, headers),
      );
    }
  }

  const passed = endpoints.every((endpoint) => 
    endpoint.violations.every((v) => v.severity !== ESeverity.Error)
  );

  return {
    format: ESpecFormat.OpenApi,
    baseUrl,
    passed,
    endpoints,
    sourcePath,
  };
}
