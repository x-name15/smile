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
 * Returns true if the given status code key represents a 2xx success response.
 * Handles numeric keys ("200"), string keys, and the wildcard "2XX".
 */
function is2xx(code: string): boolean {
  return /^2(\d{2}|XX)$/i.test(code);
}

/**
 * Flags any operation that defines zero 2xx success responses.
 * A contract with no declared success shape is impossible to validate
 * at runtime and leaves consumers guessing about the happy path.
 */
export function ruleOpenApiNo2xxResponse(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];
  const paths = doc.paths ?? {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | { responses?: Record<string, unknown> }
        | undefined;

      if (!operation) continue;

      const responseCodes = Object.keys(operation.responses ?? {});
      const has2xx = responseCodes.some(is2xx);

      if (!has2xx) {
        violations.push({
          ruleId: "no-2xx-response",
          severity: ESeverity.Error,
          message: `Operation "${method.toUpperCase()} ${pathKey}" defines no 2xx success response`,
          path: `paths.${pathKey}.${method}.responses`,
        });
      }
    }
  }

  return violations;
}
