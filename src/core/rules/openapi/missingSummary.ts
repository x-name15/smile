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
 * Flags any operation missing a `summary` field.
 * Summaries are the single line that appears in generated docs, Postman,
 * and most API tooling. Without them, endpoints are anonymous.
 */
export function ruleOpenApiMissingSummary(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];
  const paths = doc.paths ?? {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | { summary?: string }
        | undefined;

      if (!operation) continue;

      if (!operation.summary?.trim()) {
        violations.push({
          ruleId: "missing-summary",
          severity: ESeverity.Error,
          message: `Operation "${method.toUpperCase()} ${pathKey}" is missing a summary`,
          path: `paths.${pathKey}.${method}.summary`,
        });
      }
    }
  }

  return violations;
}
