import Ajv from "ajv";
import { ESeverity, type IViolation } from "../../models/index.js";

// A single Ajv instance is reused across calls — compiling schemas has a
// real cost and this library is meant to be called many times in a test suite.
const ajv = new Ajv({
  strict: false, // OpenAPI schemas use keywords (nullable, example, etc.) Ajv's strict mode rejects
  allErrors: true,
});

/**
 * Validates an actual response body against an OpenAPI/JSON schema.
 * This is the "Breaching Detector": if the real payload doesn't match
 * what the contract promises, every mismatch comes back as a violation.
 *
 * Safe to call directly from Jest/Vitest tests, e.g.:
 *
 *   const violations = validateResponseAgainstSchema(userSchema, response.body, "GET /users/:id");
 *   expect(violations).toHaveLength(0);
 */
export function validateResponseAgainstSchema(
  schema: unknown,
  actualBody: unknown,
  pathLabel: string,
  mediaType?: string
): IViolation[] {
  const violations: IViolation[] = [];

  // Hypermedia Runtime Validation
  if (mediaType === "application/vnd.api+json" && actualBody && typeof actualBody === "object") {
    const bodyObj = actualBody as Record<string, unknown>;
    if (!bodyObj.data && !bodyObj.meta && !bodyObj.errors) {
      violations.push({
        ruleId: "strict-hypermedia-runtime",
        severity: ESeverity.Error,
        message: "JSON:API response payloads must contain at least one of 'data', 'meta', or 'errors' at the root.",
        path: pathLabel,
      });
    }
  } else if (mediaType === "application/hal+json" && actualBody && typeof actualBody === "object") {
    const bodyObj = actualBody as Record<string, unknown>;
    if (!bodyObj._links) {
      violations.push({
        ruleId: "strict-hypermedia-runtime",
        severity: ESeverity.Error,
        message: "HAL response payloads must contain a '_links' object at the root.",
        path: pathLabel,
      });
    }
  }

  if (!schema || typeof schema !== "object") {
    violations.push({
      ruleId: "missing-response-schema",
      severity: ESeverity.Warning,
      message: "No schema was documented for this response, so the body could not be checked",
      path: pathLabel,
    });
    return violations;
  }

  let validate: ReturnType<typeof ajv.compile>;
  try {
    validate = ajv.compile(schema as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    violations.push({
      ruleId: "invalid-response-schema",
      severity: ESeverity.Error,
      message: `The documented schema for this response is malformed and cannot be compiled: ${message}`,
      path: pathLabel,
    });
    return violations;
  }

  const isValid = validate(actualBody);

  if (!isValid) {
    const ajvViolations = (validate.errors ?? []).map((error) => ({
      ruleId: "response-schema-mismatch",
      severity: ESeverity.Error,
      message: `${error.instancePath || "(root)"} ${error.message ?? "does not match schema"}`,
      path: pathLabel,
    }));
    violations.push(...ajvViolations);
  }

  return violations;
}