import {
  Kind,
  type DocumentNode,
  type ObjectTypeDefinitionNode,
  type InterfaceTypeDefinitionNode,
} from "graphql";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

const FIELD_HOLDER_KINDS = new Set([
  Kind.OBJECT_TYPE_DEFINITION,
  Kind.INTERFACE_TYPE_DEFINITION,
]);

/**
 * Flags fields on object types and interfaces that have no description.
 * Every public field should describe what it contains — consumers rely on
 * this for introspection, generated docs, and IDE tooling.
 */
export const ruleGraphQLMissingFieldDescription: ISmileRule = {
  meta: {
    id: "missing-field-description",
    title: "Missing Field Description",
    description: "Requires fields on GraphQL types to provide clear descriptions.",
    format: ESpecFormat.GraphQL,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];

    for (const def of (doc as DocumentNode).definitions) {
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
  },
};
