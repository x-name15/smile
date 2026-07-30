import { ESeverity, type IViolation } from "../../../models/index.js";
import type { IPostmanCollection } from "../../../parsers/postman.js";

export function requireResponseExample(doc: IPostmanCollection): IViolation[] {
  const violations: IViolation[] = [];

  function traverse(items: any[], pathPrefix: string) {
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

  if (doc.item) {
    traverse(doc.item, "item");
  }

  return violations;
}
