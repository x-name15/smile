import {
  Kind,
  type DocumentNode,
  type EnumTypeDefinitionNode,
} from "graphql";
import { ESeverity, type IViolation } from "../../../models/index.js";

/**
 * Flags individual enum values that have no description.
 * Enum values without descriptions force consumers to read external docs
 * or source code to understand what each value represents — the GraphQL
 * introspection system can expose these descriptions directly if provided.
 */
export function ruleGraphQLMissingEnumValueDescription(
  doc: DocumentNode,
): IViolation[] {
  const violations: IViolation[] = [];

  for (const def of doc.definitions) {
    if (def.kind !== Kind.ENUM_TYPE_DEFINITION) continue;

    const enumDef = def as EnumTypeDefinitionNode;

    for (const value of enumDef.values ?? []) {
      if (!value.description?.value) {
        violations.push({
          ruleId: "missing-enum-value-description",
          severity: ESeverity.Warning,
          message: `Enum value "${enumDef.name.value}.${value.name.value}" has no description`,
          path: `${enumDef.name.value}.${value.name.value}`,
        });
      }
    }
  }

  return violations;
}
