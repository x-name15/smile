import {
  Kind,
  type DocumentNode,
  type ObjectTypeDefinitionNode,
  type InterfaceTypeDefinitionNode,
  type FieldDefinitionNode,
} from "graphql";
import { ESeverity, type IViolation } from "../../../models/index.js";

const FIELD_HOLDER_KINDS = new Set([
  Kind.OBJECT_TYPE_DEFINITION,
  Kind.INTERFACE_TYPE_DEFINITION,
]);

/**
 * Checks fields of one type for `@deprecated` directives without a `reason`
 * argument. A deprecation without a reason gives consumers no guidance
 * on what to migrate to.
 */
function checkFieldsForDeprecated(
  typeName: string,
  fields: readonly FieldDefinitionNode[],
  violations: IViolation[],
): void {
  for (const field of fields) {
    const deprecatedDirective = field.directives?.find(
      (d) => d.name.value === "deprecated",
    );

    if (!deprecatedDirective) continue;

    const reasonArg = deprecatedDirective.arguments?.find(
      (a) => a.name.value === "reason",
    );

    if (!reasonArg) {
      violations.push({
        ruleId: "deprecated-without-reason",
        severity: ESeverity.Error,
        message: `Field "${typeName}.${field.name.value}" is @deprecated but provides no reason`,
        path: `${typeName}.${field.name.value}`,
      });
    }
  }
}

/**
 * Flags `@deprecated` directives on fields that have no `reason` argument.
 */
export function ruleGraphQLDeprecatedWithoutReason(
  doc: DocumentNode,
): IViolation[] {
  const violations: IViolation[] = [];

  for (const def of doc.definitions) {
    if (!FIELD_HOLDER_KINDS.has(def.kind)) continue;

    const typeDef = def as
      | ObjectTypeDefinitionNode
      | InterfaceTypeDefinitionNode;

    if (typeDef.fields) {
      checkFieldsForDeprecated(typeDef.name.value, typeDef.fields, violations);
    }
  }

  return violations;
}
