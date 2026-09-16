import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

export const id = "require-security";
export const severity = ESeverity.Error;

export const ruleRequireSecurity: ISmileRule = {
  meta: {
    id: "require-security",
    title: "Require Security Scheme",
    description: "Ensures operations define explicit security authentication schemes.",
    format: ESpecFormat.OpenApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];
    const openapiDoc = doc as TOpenApi3Doc;

    const hasGlobalSecurity = openapiDoc.security && Array.isArray(openapiDoc.security) && openapiDoc.security.length > 0;
    const isGloballyPublic = openapiDoc.security && Array.isArray(openapiDoc.security) && openapiDoc.security.length === 0;

    for (const [pathKey, pathItem] of Object.entries(openapiDoc.paths || {})) {
      if (!pathItem) continue;

      for (const method of HTTP_METHODS) {
        const operation = (pathItem as any)[method];
        if (!operation) continue;

        const hasOperationSecurity = operation.security && Array.isArray(operation.security) && operation.security.length > 0;
        
        const isExplicitlyPublic = operation.security && Array.isArray(operation.security) && operation.security.length === 0;

        if (!hasGlobalSecurity && !hasOperationSecurity && !isExplicitlyPublic && !isGloballyPublic) {
          violations.push({
            ruleId: id,
            severity,
            message: "Operation has no security defined. Define `security` globally or locally, or explicitly use `security: []` if it should be public.",
            path: `paths.${pathKey}.${method}`,
          });
        }
      }
    }

    return violations;
  },
};
