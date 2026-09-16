import {
  Kind,
  type DocumentNode,
  type EnumTypeDefinitionNode,
} from "graphql";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

/**
 * Flags individual enum values that have no description.
 * Enum values without descriptions force consumers to read external docs
 * or source code to understand what each value represents — the GraphQL
 * introspection system can expose these descriptions directly if provided.
 */
export const ruleGraphQLMissingEnumValueDescription: ISmileRule = {
  meta: {
    id: "missing-enum-value-description",
    title: "Missing Enum Value Description",
    description: "Requires enum options to define descriptive explanations.",
    format: ESpecFormat.GraphQL,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];

    for (const def of (doc as DocumentNode).definitions) {
      if (def.kind !== Kind.ENUM_TYPE_DEFINITION) continue;

      const enumDef = def as EnumTypeDefinitionNode;

      for (const value of enumDef.values ?? []) {
        if (!value.description?.value) {
          violations.push({
            ruleId: "missing-enum-value-description",
            severity: ESeverity.Error,
            message: `Enum value "${enumDef.name.value}.${value.name.value}" has no description`,
            path: `${enumDef.name.value}.${value.name.value}`,
          });
        }
      }
    }

    return violations;
  },
};
