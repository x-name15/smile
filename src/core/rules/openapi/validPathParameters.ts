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
 * Flags phantom path parameters in an OpenAPI spec.
 * If a path contains a template variable like `/users/{id}`, this rule
 * checks that `id` is explicitly documented in the `parameters` array 
 * (either at the path level or the operation level).
 * Failing to document path parameters leads to broken SDK generation
 * and unvalidated inputs in the backend.
 */
export function ruleOpenApiValidPathParameters(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];
  const paths = doc.paths ?? {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    // Extract all expected path parameters from the URL template (e.g. {id}, {org_id})
    const paramMatches = [...pathKey.matchAll(/\{([^}]+)\}/g)];
    const expectedParams = paramMatches.map(m => m[1]);
    
    if (expectedParams.length === 0) {
      continue;
    }

    // Helper to find a parameter by name and 'in: path' within an array of parameter objects/refs
    const hasPathParam = (paramsArray: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject | OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject> = [], paramName: string): boolean => {
      return paramsArray.some(p => {
        // We skip full validation of $ref for this simple static rule to avoid false positives,
        // but if it is an inline parameter, it MUST match name and 'in: path'.
        if ("$ref" in p) return true; // Assume ref might contain it to avoid strict false positive
        return p.in === "path" && p.name === paramName;
      });
    };

    const pathLevelParams = pathItem.parameters || [];

    // Check at the operation level as well
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject | undefined;
      if (!operation) continue;

      const opLevelParams = operation.parameters || [];
      const combinedParams = [...pathLevelParams, ...opLevelParams];

      for (const expectedParam of expectedParams) {
        if (!hasPathParam(combinedParams, expectedParam)) {
          violations.push({
            ruleId: "valid-path-parameters",
            severity: ESeverity.Error,
            message: `Path parameter "{${expectedParam}}" is used in the URL but not defined in the parameters array`,
            path: `paths.${pathKey}.${method}`,
          });
        }
      }
    }
  }

  return violations;
}
