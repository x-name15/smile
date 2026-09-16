import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TSchemaObject = Record<string, unknown>;

/**
 * Recursively walks schema properties looking for array-typed properties
 * that have no `items` definition. An array without `items` is an untyped
 * collection — consumers have no idea what each element contains.
 */
function findArraysWithoutItems(
  schema: TSchemaObject,
  basePath: string,
  violations: IViolation[],
): void {
  const properties = schema.properties as
    | Record<string, TSchemaObject>
    | undefined;

  if (!properties) return;

  for (const [propName, propSchema] of Object.entries(properties)) {
    if (propSchema.type === "array" && !propSchema.items) {
      violations.push({
        ruleId: "array-without-items",
        severity: ESeverity.Error,
        message: `Array property "${propName}" has no items definition`,
        path: `${basePath}.properties.${propName}`,
      });
    }

    if (propSchema.type === "object") {
      findArraysWithoutItems(
        propSchema,
        `${basePath}.properties.${propName}`,
        violations,
      );
    }
  }
}

/**
 * Flags array-typed properties missing an `items` schema.
 * An array without items is unvalidatable — you can't check the contents.
 */
export const ruleJsonSchemaArrayWithoutItems: ISmileRule = {
  meta: {
    id: "array-without-items",
    title: "Array Without Items",
    description: "Guarantees array schemas specify an items schema defining element types.",
    format: ESpecFormat.JsonSchema,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];
    const schema = doc as TSchemaObject;

    // Check root-level type: array
    if (schema.type === "array" && !schema.items) {
      violations.push({
        ruleId: "array-without-items",
        severity: ESeverity.Error,
        message: "Root schema is an array with no items definition",
        path: "(root)",
      });
    }

    findArraysWithoutItems(schema, "(root)", violations);
    return violations;
  },
};
