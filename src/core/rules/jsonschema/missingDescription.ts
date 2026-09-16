import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TSchemaObject = Record<string, unknown>;

/**
 * Recursively walks `properties` and flags any that have no `description`.
 * Undescribed properties make generated documentation and form UIs useless.
 */
function findUndescribedProperties(
  schema: TSchemaObject,
  basePath: string,
  violations: IViolation[],
): void {
  const properties = schema.properties as
    | Record<string, TSchemaObject>
    | undefined;

  if (!properties) return;

  for (const [propName, propSchema] of Object.entries(properties)) {
    if (!propSchema.description) {
      violations.push({
        ruleId: "missing-description",
        severity: ESeverity.Error,
        message: `Property "${propName}" has no description`,
        path: `${basePath}.properties.${propName}`,
      });
    }

    if (propSchema.type === "object") {
      findUndescribedProperties(
        propSchema,
        `${basePath}.properties.${propName}`,
        violations,
      );
    }
  }
}

/**
 * Flags schema properties missing a `description` field.
 */
export const ruleJsonSchemaMissingDescription: ISmileRule = {
  meta: {
    id: "missing-description",
    title: "Missing Schema Description",
    description: "Requires schema definitions and nested models to provide descriptive context.",
    format: ESpecFormat.JsonSchema,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];
    findUndescribedProperties(doc as TSchemaObject, "(root)", violations);
    return violations;
  },
};
