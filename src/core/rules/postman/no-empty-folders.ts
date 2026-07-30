import { ESeverity, type IViolation } from "../../../models/index.js";
import type { IPostmanCollection } from "../../../parsers/postman.js";

export function noEmptyFolders(doc: IPostmanCollection): IViolation[] {
  const violations: IViolation[] = [];

  function traverse(items: any[], pathPrefix: string) {
    items.forEach((item, index) => {
      const currentPath = `${pathPrefix}[${index}]`;
      if (item.item) {
        // It's a folder
        if (!Array.isArray(item.item) || item.item.length === 0) {
          violations.push({
            ruleId: "no-empty-folders",
            severity: ESeverity.Warning,
            message: `Folder "${item.name}" is empty.`,
            path: currentPath,
          });
        } else {
          traverse(item.item, `${currentPath}.item`);
        }
      }
    });
  }

  if (doc.item) {
    traverse(doc.item, "item");
  }

  return violations;
}
