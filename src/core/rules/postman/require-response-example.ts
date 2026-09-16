import { ESpecFormat, ESeverity, type IViolation, type ISmileRule, type IPostmanCollection, type IPostmanItem } from "../../../models/index.js";

export const requireResponseExample: ISmileRule = {
  meta: {
    id: "require-response-example",
    title: "Documented Response Examples",
    description: "Requires collection endpoints to include at least one saved response example.",
    format: ESpecFormat.Postman,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];

    function traverse(items: IPostmanItem[], pathPrefix: string) {
      items.forEach((item, index) => {
        const currentPath = `${pathPrefix}[${index}]`;
        if (item.request) {
          // It's a request
          if (!Array.isArray(item.response) || item.response.length === 0) {
            violations.push({
              ruleId: "require-response-example",
              severity: ESeverity.Error,
              message: `Request "${item.name}" has no saved response examples. At least one example is required for runtime validation.`,
              path: currentPath,
            });
          }
        } else if (item.item) {
          // It's a folder
          traverse(item.item, `${currentPath}.item`);
        }
      });
    }

    if ((doc as IPostmanCollection).item) {
      traverse((doc as IPostmanCollection).item, "item");
    }

    return violations;
  },
};
