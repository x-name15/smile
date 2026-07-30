import {
  Kind,
  type DocumentNode,
  type ObjectTypeDefinitionNode,
  type InterfaceTypeDefinitionNode,
  type InputObjectTypeDefinitionNode,
} from "graphql";
import { ESeverity, type IViolation } from "../../../models/index.js";

const FIELD_HOLDER_KINDS = new Set([
  Kind.OBJECT_TYPE_DEFINITION,
  Kind.INTERFACE_TYPE_DEFINITION,
  Kind.INPUT_OBJECT_TYPE_DEFINITION,
]);

/**
 * Flags fields that do not start with a lowercase letter (camelCase).
 */
export function ruleGraphQLRequireCamelCaseFields(
  doc: DocumentNode,
): IViolation[] {
  const violations: IViolation[] = [];

  for (const def of doc.definitions) {
    if (!FIELD_HOLDER_KINDS.has(def.kind)) continue;

    const typeDef = def as
      | ObjectTypeDefinitionNode
      | InterfaceTypeDefinitionNode
      | InputObjectTypeDefinitionNode;

    for (const field of typeDef.fields ?? []) {
      const name = field.name.value;
      if (name.length > 0 && name[0] !== name[0].toLowerCase()) {
        violations.push({
          ruleId: "require-camel-case-fields",
          severity: ESeverity.Error,
          message: `Field "${typeDef.name.value}.${name}" should use camelCase (start with a lowercase letter)`,
          path: `${typeDef.name.value}.${name}`,
        });
      }
    }
  }

  return violations;
}
