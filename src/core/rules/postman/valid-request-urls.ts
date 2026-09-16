import { ESpecFormat, ESeverity, type IViolation, type ISmileRule, type IPostmanCollection, type IPostmanItem } from "../../../models/index.js";

/**
 * Validates that every request in a Postman collection has a non-empty string or raw URL.
 */
export const validRequestUrls: ISmileRule = {
  meta: {
    id: "valid-request-urls",
    title: "Valid Request URLs",
    description: "Ensures all collection requests specify a non-empty, valid endpoint URL.",
    format: ESpecFormat.Postman,
    defaultSeverity: "error",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];

    function traverse(items: IPostmanItem[], pathPrefix: string) {
      items.forEach((item, index) => {
        const currentPath = `${pathPrefix}[${index}]`;
        if (item.request) {
          const url = item.request.url;
          let isValid = false;

          if (typeof url === "string" && url.trim().length > 0) {
            isValid = true;
          } else if (url && typeof url === "object" && typeof (url as { raw?: string }).raw === "string" && (url as { raw?: string }).raw!.trim().length > 0) {
            isValid = true;
          }

          if (!isValid) {
            violations.push({
              ruleId: "valid-request-urls",
              severity: ESeverity.Error,
              message: `Request "${item.name}" has an empty or invalid URL.`,
              path: `${currentPath}.request.url`,
            });
          }
        } else if (item.item) {
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
