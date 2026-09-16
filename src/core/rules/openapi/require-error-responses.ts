import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

/**
 * Requires every HTTP operation to define at least one error response (4xx, 5xx, or default).
 */
export const ruleRequireErrorResponses: ISmileRule = {
  meta: {
    id: "require-error-responses",
    title: "Require Error Responses (4xx/5xx)",
    description: "Requires every HTTP operation to define at least one error response (4xx, 5xx, or default).",
    format: ESpecFormat.OpenApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];
    const openapiDoc = doc as TOpenApi3Doc;

    if (!openapiDoc.paths || typeof openapiDoc.paths !== "object") return violations;

    for (const [pathKey, pathItem] of Object.entries(openapiDoc.paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;

      for (const method of HTTP_METHODS) {
        const operation = (pathItem as any)[method];
        if (!operation || !operation.responses) continue;

        const responseCodes = Object.keys(operation.responses);
        const hasErrorResponse = responseCodes.some(
          (code) => code === "default" || /^[45]/.test(code)
        );

        if (!hasErrorResponse) {
          violations.push({
            ruleId: "require-error-responses",
            severity: ESeverity.Warning,
            message: `Operation ${method.toUpperCase()} ${pathKey} should define at least one error response (4xx, 5xx, or default).`,
            path: `paths.${pathKey}.${method}.responses`,
          });
        }
      }
    }

    return violations;
  },
};
