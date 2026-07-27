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

/**
 * Only GET is exercised automatically for now — it has no side effects,
 * so it's safe to hit a real server without the caller's explicit intent.
 * POST/PUT/DELETE support is a deliberate future step (needs example
 * bodies and a way to clean up whatever gets created).
 */
const AUTO_TESTABLE_METHOD = "get";

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
 * successful GET should return.
 */
function findExpectedSuccessResponse(
  operation: TOperation,
): { statusCode: string; schema: unknown } | null {
  const responses = operation.responses ?? {};

  for (const [statusCode, responseObj] of Object.entries(responses)) {
    if (!statusCode.startsWith("2")) continue;

    const response = responseObj as OpenAPIV3.ResponseObject;
    const schema = response.content?.["application/json"]?.schema;

    return { statusCode, schema };
  }

  return null;
}

/**
 * Tests a single GET operation against a live server: calls it, checks
 * the status code matches a documented 2xx, and validates the body
 * against the documented schema.
 */
async function testGetOperation(
  baseUrl: string,
  pathTemplate: string,
  operation: TOperation,
): Promise<IEndpointTestResult> {
  const label = `GET ${pathTemplate}`;
  const parameters = operation.parameters ?? [];
  const url = buildConcreteUrl(baseUrl, pathTemplate, parameters);

  if (url === null) {
    return {
      method: "GET",
      path: pathTemplate,
      violations: [],
      skipped: true,
      skipReason:
        "One or more path parameters have no example/default value to test with",
    };
  }

  const expected = findExpectedSuccessResponse(operation);

  if (expected === null) {
    return {
      method: "GET",
      path: pathTemplate,
      violations: [],
      skipped: true,
      skipReason: "No documented 2xx response to compare against",
    };
  }

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      method: "GET",
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
    const body: unknown = await response.json().catch(() => undefined);
    violations.push(
      ...validateResponseAgainstSchema(expected.schema, body, label),
    );
  }

  return {
    method: "GET",
    path: pathTemplate,
    violations,
    skipped: false,
  };
}

/**
 * Runs the Breaching Detector smoke test: parses an OpenAPI spec, then
 * calls every documented GET endpoint against `baseUrl` and validates
 * the real response against the documented schema.
 */
export async function runSmokeTest(
  sourcePath: string,
  baseUrl: string,
): Promise<ITestResult> {
  const parsed = await parseOpenApiSpec(sourcePath);
  const doc = parsed.raw as TOpenApi3Doc;
  const paths = doc.paths ?? {};

  const endpoints: IEndpointTestResult[] = [];

  for (const [pathTemplate, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const operation = (pathItem as Record<string, unknown>)[
      AUTO_TESTABLE_METHOD
    ] as TOperation | undefined;

    if (!operation) continue;

    const result = await testGetOperation(baseUrl, pathTemplate, operation);
    endpoints.push(result);
  }

  const passed = endpoints.every((endpoint) => endpoint.violations.length === 0);

  return {
    format: ESpecFormat.OpenApi,
    baseUrl,
    passed,
    endpoints,
  };
}