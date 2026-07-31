import { ESeverity, type IViolation } from "../../../models/index.js";

type TSchemaObject = Record<string, unknown>;

/**
 * Recursively walks a schema object looking for `type: "object"`
 * and enforces that `additionalProperties: false` is explicitly set to prevent
 * arbitrary data in the payloads.
 */
function findMissingAdditionalProperties(
  schema: TSchemaObject,
  basePath: string,
  violations: IViolation[],
): void {
  // If this schema represents an object
  if (schema.type === "object" || typeof schema.properties === "object") {
    // If it has properties defined but additionalProperties is missing or not false
    if (schema.properties && schema.additionalProperties !== false) {
      violations.push({
        ruleId: "require-additional-properties",
        severity: ESeverity.Error,
        message: `Object schema is missing 'additionalProperties: false'`,
        path: basePath,
      });
    }

    const properties = schema.properties as Record<string, TSchemaObject> | undefined;
    if (properties) {
      for (const [propName, propSchema] of Object.entries(properties)) {
        findMissingAdditionalProperties(
          propSchema,
          `${basePath}.properties.${propName}`,
          violations,
        );
      }
    }
  }
  
  // Array items might be objects too
  if (schema.type === "array" || typeof schema.items === "object") {
    const items = schema.items as TSchemaObject | undefined;
    if (items && !Array.isArray(items)) {
      findMissingAdditionalProperties(
        items,
        `${basePath}.items`,
        violations,
      );
    }
  }
}

/**
 * Flags schema objects that do not explicitly disable additional properties.
 */
export function ruleJsonSchemaRequireAdditionalProperties(doc: TSchemaObject): IViolation[] {
  const violations: IViolation[] = [];
  findMissingAdditionalProperties(doc, "(root)", violations);
  return violations;
}
