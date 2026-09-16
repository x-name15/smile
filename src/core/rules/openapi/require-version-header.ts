import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

/**
 * Validates that HTTP operations define an API versioning strategy (either via path prefix or version header parameter).
 */
export const ruleRequireVersionHeader: ISmileRule = {
  meta: {
    id: "require-version-header",
    title: "Require API Versioning Strategy",
    description: "Ensures operations define an API versioning strategy via version header parameter or URI path prefix.",
    format: ESpecFormat.OpenApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];
    const openapiDoc = doc as TOpenApi3Doc;

    if (!openapiDoc.paths || typeof openapiDoc.paths !== "object") return violations;

    for (const [pathKey, pathItem] of Object.entries(openapiDoc.paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;

      // Check if path itself includes version prefix (e.g. /v1/, /v2/, /api/v1/)
      const hasPathVersion = /\/v\d+(\/|$)/i.test(pathKey);

      for (const method of HTTP_METHODS) {
        const operation = (pathItem as any)[method];
        if (!operation) continue;

        if (hasPathVersion) {
          continue;
        }

        // Check operation and path level parameters for a version header
        const allParams = [
          ...((pathItem as any).parameters || []),
          ...(operation.parameters || []),
        ];

        const hasVersionParam = allParams.some((p) => {
          if (!p || p.in !== "header") return false;
          const name = (p.name || "").toLowerCase();
          return (
            name === "x-api-version" ||
            name === "accept-version" ||
            name === "api-version" ||
            name === "version"
          );
        });

        if (!hasVersionParam) {
          violations.push({
            ruleId: "require-version-header",
            severity: ESeverity.Warning,
            message: `Operation ${method.toUpperCase()} ${pathKey} lacks an API versioning strategy. Specify a version header (e.g. "X-API-Version") or a path version prefix (e.g. "/v1/").`,
            path: `paths.${pathKey}.${method}`,
          });
        }
      }
    }

    return violations;
  },
};
