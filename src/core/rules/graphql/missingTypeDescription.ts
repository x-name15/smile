import {
  Kind,
  type DocumentNode,
  type ObjectTypeDefinitionNode,
  type InterfaceTypeDefinitionNode,
  type EnumTypeDefinitionNode,
  type InputObjectTypeDefinitionNode,
} from "graphql";
import { ESeverity, type IViolation } from "../../../models/index.js";

type TDescribableTypeDef =
  | ObjectTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode;

const DESCRIBED_KINDS = new Set([
  Kind.OBJECT_TYPE_DEFINITION,
  Kind.INTERFACE_TYPE_DEFINITION,
  Kind.ENUM_TYPE_DEFINITION,
  Kind.INPUT_OBJECT_TYPE_DEFINITION,
]);

/**
 * Flags object types, interfaces, enums, and input types without a
 * description. Undescribed types make auto-generated docs unreadable
 * and GraphQL introspection uninformative.
 */
export function ruleGraphQLMissingTypeDescription(
  doc: DocumentNode,
): IViolation[] {
  const violations: IViolation[] = [];

  for (const def of doc.definitions) {
    if (!DESCRIBED_KINDS.has(def.kind)) continue;

    const typeDef = def as TDescribableTypeDef;

    if (!typeDef.description?.value) {
      violations.push({
        ruleId: "missing-type-description",
        severity: ESeverity.Warning,
        message: `Type "${typeDef.name.value}" has no description`,
        path: typeDef.name.value,
      });
    }
  }

  return violations;
}
