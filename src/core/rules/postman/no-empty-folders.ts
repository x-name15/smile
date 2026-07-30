import { ESeverity, type IViolation, type IPostmanCollection, type IPostmanItem } from "../../../models/index.js";

export function noEmptyFolders(doc: IPostmanCollection): IViolation[] {
  const violations: IViolation[] = [];

  function traverse(items: IPostmanItem[], pathPrefix: string) {
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
