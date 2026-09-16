import { ESpecFormat, ESeverity, type IViolation, type ISmileRule, type IPostmanCollection, type IPostmanItem } from "../../../models/index.js";

export const requireRequestDescription: ISmileRule = {
  meta: {
    id: "require-request-description",
    title: "Documented Postman Requests",
    description: "Requires requests in Postman collections to contain descriptive documentation.",
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
          if (!item.request.description || item.request.description.trim() === "") {
            violations.push({
              ruleId: "require-request-description",
              severity: ESeverity.Error,
              message: `Request "${item.name}" is missing a description.`,
              path: `${currentPath}.request.description`,
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
