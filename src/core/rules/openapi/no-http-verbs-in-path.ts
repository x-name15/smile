import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESeverity, type IViolation } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;

export const id = "no-http-verbs-in-path";
export const severity = ESeverity.Warning; // Warning by default since many legacy APIs do this

const VERBS_REGEX = /\b(get|post|put|patch|delete|create|update|remove|fetch|set)\b/i;

export function run(doc: TOpenApi3Doc): IViolation[] {
  const violations: IViolation[] = [];

  for (const pathKey of Object.keys(doc.paths || {})) {
    // We only care about the literal path segments, not variables
    const pathWithoutVars = pathKey.replace(/\{[^}]+\}/g, "");
    
    if (VERBS_REGEX.test(pathWithoutVars)) {
      violations.push({
        ruleId: id,
        severity,
        message: "Paths should represent resources (nouns), not actions (verbs). Remove HTTP verbs from the URL.",
        path: `paths.${pathKey}`,
      });
    }
  }

  return violations;
}
