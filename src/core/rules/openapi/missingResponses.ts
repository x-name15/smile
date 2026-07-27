import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESeverity, type IViolation } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

/**
 * Flags any operation missing a `responses` object, or with an empty one.
 * A contract that doesn't declare what it returns can't be validated at runtime.
 */
export function ruleMissingResponses(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];
  const paths = doc.paths ?? {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | { responses?: Record<string, unknown> }
        | undefined;

      if (!operation) continue;

      const responseKeys = Object.keys(operation.responses ?? {});

      if (responseKeys.length === 0) {
        violations.push({
          ruleId: "missing-responses",
          severity: ESeverity.Error,
          message: `Operation "${method.toUpperCase()} ${pathKey}" declares no responses`,
          path: `paths.${pathKey}.${method}.responses`,
        });
      }
    }
  }

  return violations;
}
