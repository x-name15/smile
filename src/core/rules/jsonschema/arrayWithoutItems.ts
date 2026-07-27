import { ESeverity, type IViolation } from "../../../models/index.js";

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
export function ruleJsonSchemaArrayWithoutItems(
  doc: TSchemaObject,
): IViolation[] {
  const violations: IViolation[] = [];

  // Check root-level type: array
  if (doc.type === "array" && !doc.items) {
    violations.push({
      ruleId: "array-without-items",
      severity: ESeverity.Error,
      message: "Root schema is an array with no items definition",
      path: "(root)",
    });
  }

  findArraysWithoutItems(doc, "(root)", violations);
  return violations;
}
