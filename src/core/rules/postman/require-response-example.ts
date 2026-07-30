import { ESeverity, type IViolation, type IPostmanCollection, type IPostmanItem } from "../../../models/index.js";

export function requireResponseExample(doc: IPostmanCollection): IViolation[] {
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

  if (doc.item) {
    traverse(doc.item, "item");
  }

  return violations;
}
