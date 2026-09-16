import { ESpecFormat, ESeverity, type IViolation, type ISmileRule, type IPostmanCollection, type IPostmanItem } from "../../../models/index.js";

export const noEmptyFolders: ISmileRule = {
  meta: {
    id: "no-empty-folders",
    title: "No Empty Folders",
    description: "Flags empty folder groups within Postman collections.",
    format: ESpecFormat.Postman,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
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

    if ((doc as IPostmanCollection).item) {
      traverse((doc as IPostmanCollection).item, "item");
    }

    return violations;
  },
};
