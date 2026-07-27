import {
  Kind,
  type DocumentNode,
  type ObjectTypeDefinitionNode,
  type InterfaceTypeDefinitionNode,
} from "graphql";
import { ESeverity, type IViolation } from "../../../models/index.js";

const FIELD_HOLDER_KINDS = new Set([
  Kind.OBJECT_TYPE_DEFINITION,
  Kind.INTERFACE_TYPE_DEFINITION,
]);

/**
 * Flags fields on object types and interfaces that have no description.
 * Every public field should describe what it contains — consumers rely on
 * this for introspection, generated docs, and IDE tooling.
 */
export function ruleGraphQLMissingFieldDescription(
  doc: DocumentNode,
): IViolation[] {
  const violations: IViolation[] = [];

  for (const def of doc.definitions) {
    if (!FIELD_HOLDER_KINDS.has(def.kind)) continue;

    const typeDef = def as
      | ObjectTypeDefinitionNode
      | InterfaceTypeDefinitionNode;

    for (const field of typeDef.fields ?? []) {
      if (!field.description?.value) {
        violations.push({
          ruleId: "missing-field-description",
          severity: ESeverity.Error,
          message: `Field "${typeDef.name.value}.${field.name.value}" has no description`,
          path: `${typeDef.name.value}.${field.name.value}`,
        });
      }
    }
  }

  return violations;
}
