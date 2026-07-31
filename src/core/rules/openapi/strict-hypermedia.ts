import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESeverity, type IViolation } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
type TOperation = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
type TResponse = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
type TSchema = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

export function ruleStrictHypermedia(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];
  const paths = doc.paths ?? {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as TOperation | undefined;
      if (!operation || !operation.responses) continue;

      for (const [statusCode, responseRef] of Object.entries(operation.responses)) {
        // We skip refs in the linter since bundler resolves them, 
        // but if it's still a ref, we just skip.
        if ("$ref" in responseRef) continue;

        const response = responseRef as TResponse;
        if (!response.content) continue;

        for (const [mediaType, mediaObj] of Object.entries(response.content)) {
          if (!mediaObj.schema || "$ref" in mediaObj.schema) continue;
          
          const schema = mediaObj.schema as TSchema;
          const basePath = `paths.${pathKey}.${method}.responses.${statusCode}.content["${mediaType}"].schema`;

          if (mediaType === "application/vnd.api+json") {
            const props = schema.properties || {};
            if (!props.data && !props.meta && !props.errors) {
              violations.push({
                ruleId: "strict-hypermedia",
                severity: ESeverity.Error,
                message: "JSON:API responses must define at least one of 'data', 'meta', or 'errors' in their schema.",
                path: basePath,
              });
            }
          }

          if (mediaType === "application/hal+json") {
            const props = schema.properties || {};
            if (!props._links) {
              violations.push({
                ruleId: "strict-hypermedia",
                severity: ESeverity.Error,
                message: "HAL responses must define a '_links' property in their schema.",
                path: basePath,
              });
            }
          }
        }
      }
    }
  }

  return violations;
}
