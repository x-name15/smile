import { ESpecFormat, ESeverity, type IViolation, type ISmileRule, type IPostmanCollection } from "../../../models/index.js";

/**
 * Requires Postman collections to declare a non-empty description in info.description.
 */
export const requireCollectionDescription: ISmileRule = {
  meta: {
    id: "require-collection-description",
    title: "Documented Collection Description",
    description: "Requires top-level Postman collections to declare a descriptive info.description.",
    format: ESpecFormat.Postman,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];

    const collection = doc as IPostmanCollection;
    const desc = collection.info?.description?.trim();

    if (!desc) {
      violations.push({
        ruleId: "require-collection-description",
        severity: ESeverity.Error,
        message: `Postman collection "${collection.info?.name || "Unnamed"}" is missing an info.description.`,
        path: "info.description",
      });
    }

    return violations;
  },
};
