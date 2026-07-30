import type { DocumentNode } from "graphql";
import type { IViolation } from "../../../models/index.js";
import { ruleGraphQLMissingTypeDescription } from "./missingTypeDescription.js";
import { ruleGraphQLMissingFieldDescription } from "./missingFieldDescription.js";
import { ruleGraphQLDeprecatedWithoutReason } from "./deprecatedWithoutReason.js";
import { ruleGraphQLMissingEnumValueDescription } from "./missingEnumValueDescription.js";
import { ruleGraphQLRequirePascalCaseTypes } from "./requirePascalCaseTypes.js";
import { ruleGraphQLRequireCamelCaseFields } from "./requireCamelCaseFields.js";

type TRule = (doc: DocumentNode) => IViolation[];

/**
 * All active GraphQL SDL lint rules. Add new rules here to wire them in.
 */
export const graphqlRules: TRule[] = [
  ruleGraphQLMissingTypeDescription,
  ruleGraphQLMissingFieldDescription,
  ruleGraphQLDeprecatedWithoutReason,
  ruleGraphQLMissingEnumValueDescription,
  ruleGraphQLRequirePascalCaseTypes,
  ruleGraphQLRequireCamelCaseFields,
];
