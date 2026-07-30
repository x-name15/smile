import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESeverity, type IViolation } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

export const id = "require-security";
export const severity = ESeverity.Error;

export function run(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];

  const hasGlobalSecurity = doc.security && Array.isArray(doc.security) && doc.security.length > 0;
  const isGloballyPublic = doc.security && Array.isArray(doc.security) && doc.security.length === 0;

  for (const [pathKey, pathItem] of Object.entries(doc.paths || {})) {
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
}
