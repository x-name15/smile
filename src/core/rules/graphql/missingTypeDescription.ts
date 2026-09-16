import {
  Kind,
  type DocumentNode,
  type ObjectTypeDefinitionNode,
  type InterfaceTypeDefinitionNode,
  type EnumTypeDefinitionNode,
  type InputObjectTypeDefinitionNode,
} from "graphql";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

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
export const ruleGraphQLMissingTypeDescription: ISmileRule = {
  meta: {
    id: "missing-type-description",
    title: "Missing Type Description",
    description:
      "Requires GraphQL Object, Interface, and Union types to include documentation strings.",
    format: ESpecFormat.GraphQL,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];

    for (const def of (doc as DocumentNode).definitions) {
      if (!DESCRIBED_KINDS.has(def.kind)) continue;

      const typeDef = def as TDescribableTypeDef;

      if (!typeDef.description?.value) {
        violations.push({
          ruleId: "missing-type-description",
          severity: ESeverity.Error,
          message: `Type "${typeDef.name.value}" has no description`,
          path: typeDef.name.value,
        });
      }
    }

    return violations;
  },
};
