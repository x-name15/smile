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
 * Flags any operation (path + method) missing an `operationId`.
 * Missing operationIds make it hard to generate SDKs and trace requests.
 */
export function ruleMissingOperationId(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];
  const paths = doc.paths ?? {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | { operationId?: string }
        | undefined;

      if (!operation) continue;

      if (!operation.operationId) {
        violations.push({
          ruleId: "missing-operation-id",
          severity: ESeverity.Error,
          message: `Operation "${method.toUpperCase()} ${pathKey}" is missing an operationId`,
          path: `paths.${pathKey}.${method}`,
        });
      }
    }
  }

  return violations;
}
