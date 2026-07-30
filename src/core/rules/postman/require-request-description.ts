import { ESeverity, type IViolation } from "../../../models/index.js";
import type { IPostmanCollection } from "../../../parsers/postman.js";

export function requireRequestDescription(doc: IPostmanCollection): IViolation[] {
  const violations: IViolation[] = [];

  function traverse(items: any[], pathPrefix: string) {
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

  if (doc.item) {
    traverse(doc.item, "item");
  }

  return violations;
}
