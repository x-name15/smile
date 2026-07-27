import { ESeverity, type IViolation } from "../../../models/index.js";

type TSchemaObject = Record<string, unknown>;

/**
 * Recursively walks a schema object's `properties` looking for ones with
 * no `type` and no valid alternative (`$ref`, `oneOf`, `anyOf`, `allOf`).
 * Mirrors the OpenAPI rule of the same name — JSON Schema uses the same convention.
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
        ruleId: "untyped-property",
        severity: ESeverity.Error,
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
 * Flags schema properties that have no `type` and no valid type alternative.
 */
export function ruleJsonSchemaUntypedProperty(doc: TSchemaObject): IViolation[] {
  const violations: IViolation[] = [];
  findUntypedProperties(doc, "(root)", violations);
  return violations;
}
