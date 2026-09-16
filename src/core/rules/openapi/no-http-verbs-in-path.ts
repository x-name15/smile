import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;

export const id = "no-http-verbs-in-path";
export const severity = ESeverity.Warning; // Warning by default since many legacy APIs do this

const VERBS_REGEX = /\b(get|post|put|patch|delete|create|update|remove|fetch|set)\b/i;

export const ruleNoHttpVerbsInPath: ISmileRule = {
  meta: {
    id: "no-http-verbs-in-path",
    title: "No HTTP Verbs in Path",
    description: "Enforces RESTful URI standards by disallowing verbs (get, post, delete) in endpoint paths.",
    format: ESpecFormat.OpenApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];
    const openapiDoc = doc as TOpenApi3Doc;

    for (const pathKey of Object.keys(openapiDoc.paths || {})) {
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
  },
};
