import {
  Kind,
  type DocumentNode,
  type ObjectTypeDefinitionNode,
  type InterfaceTypeDefinitionNode,
  type EnumTypeDefinitionNode,
  type InputObjectTypeDefinitionNode,
  type UnionTypeDefinitionNode,
} from "graphql";
import { ESeverity, type IViolation } from "../../../models/index.js";

const TYPE_KINDS = new Set([
  Kind.OBJECT_TYPE_DEFINITION,
  Kind.INTERFACE_TYPE_DEFINITION,
  Kind.ENUM_TYPE_DEFINITION,
  Kind.INPUT_OBJECT_TYPE_DEFINITION,
  Kind.UNION_TYPE_DEFINITION,
]);

/**
 * Flags any type names that do not start with a capital letter (PascalCase).
 */
export function ruleGraphQLRequirePascalCaseTypes(
  doc: DocumentNode,
): IViolation[] {
  const violations: IViolation[] = [];

  for (const def of doc.definitions) {
    if (!TYPE_KINDS.has(def.kind)) continue;

    const typeDef = def as
      | ObjectTypeDefinitionNode
      | InterfaceTypeDefinitionNode
      | EnumTypeDefinitionNode
      | InputObjectTypeDefinitionNode
      | UnionTypeDefinitionNode;
      
    const name = typeDef.name.value;
    // Check if the first character is lowercase
    if (name.length > 0 && name[0] !== name[0].toUpperCase()) {
      violations.push({
        ruleId: "require-pascal-case-types",
        severity: ESeverity.Error,
        message: `Type "${name}" should use PascalCase (start with a capital letter)`,
        path: name,
      });
    }
  }

  return violations;
}
