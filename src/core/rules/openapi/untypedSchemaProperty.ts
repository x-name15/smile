import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESeverity, type IViolation } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
type TSchemaObject = Record<string, unknown>;

/**
 * Recursively walks a schema object's properties looking for ones
 * missing a `type` (and without `$ref`, `oneOf`, `anyOf`, or `allOf`,
 * which are valid alternatives to a plain type).
 */
function findUntypedProperties(
  schema: TSchemaObject,
  basePath: string,
  violations: IViolation[],
): void {
  const properties = schema.properties as
    | Record<string, TSchemaObject>
    | undefined;

  if (!properties) return;

  for (const [propName, propSchema] of Object.entries(properties)) {
    const hasType = Boolean(propSchema.type);
    const hasAlternative = Boolean(
      propSchema.$ref ??
        propSchema.oneOf ??
        propSchema.anyOf ??
        propSchema.allOf,
    );

    if (!hasType && !hasAlternative) {
      violations.push({
        ruleId: "untyped-schema-property",
        severity: ESeverity.Warning,
        message: `Property "${propName}" has no declared type`,
        path: `${basePath}.properties.${propName}`,
      });
    }

    if (propSchema.type === "object") {
      findUntypedProperties(
        propSchema,
        `${basePath}.properties.${propName}`,
        violations,
      );
    }
  }
}

/**
 * Flags schema properties (in components.schemas) that have no `type`
 * and no valid alternative ($ref/oneOf/anyOf/allOf).
 */
export function ruleUntypedSchemaProperty(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];
  const schemas = (doc.components?.schemas ?? {}) as Record<
    string,
    TSchemaObject
  >;

  for (const [schemaName, schema] of Object.entries(schemas)) {
    findUntypedProperties(
      schema,
      `components.schemas.${schemaName}`,
      violations,
    );
  }

  return violations;
}
