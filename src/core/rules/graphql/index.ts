import { type ISmileRule } from "../../../models/index.js";
import { ruleGraphQLMissingTypeDescription } from "./missingTypeDescription.js";
import { ruleGraphQLMissingFieldDescription } from "./missingFieldDescription.js";
import { ruleGraphQLDeprecatedWithoutReason } from "./deprecatedWithoutReason.js";
import { ruleGraphQLMissingEnumValueDescription } from "./missingEnumValueDescription.js";
import { ruleGraphQLRequirePascalCaseTypes } from "./requirePascalCaseTypes.js";
import { ruleGraphQLRequireCamelCaseFields } from "./requireCamelCaseFields.js";

/**
 * All active GraphQL SDL lint rules. Add new rules here to wire them in.
 */
export const graphqlRules: ISmileRule[] = [
  ruleGraphQLMissingTypeDescription,
  ruleGraphQLMissingFieldDescription,
  ruleGraphQLDeprecatedWithoutReason,
  ruleGraphQLMissingEnumValueDescription,
  ruleGraphQLRequirePascalCaseTypes,
  ruleGraphQLRequireCamelCaseFields,
];
