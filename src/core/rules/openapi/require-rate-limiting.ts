import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ESpecFormat, ESeverity, type IViolation, type ISmileRule } from "../../../models/index.js";

type TOpenApi3Doc = OpenAPIV3.Document | OpenAPIV3_1.Document;
const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;
const MUTATING_METHODS = ["post", "put", "delete", "patch"] as const;

/**
 * Validates rate limiting governance on HTTP operations.
 * Enforces Retry-After / RateLimit headers when 429 is defined, and ensures mutating
 * operations document rate limiting handling.
 */
export const ruleRequireRateLimiting: ISmileRule = {
  meta: {
    id: "require-rate-limiting",
    title: "Require Rate Limiting Governance",
    description: "Ensures mutating operations define 429 response codes, and enforces Retry-After or RateLimit-* headers.",
    format: ESpecFormat.OpenApi,
    defaultSeverity: "warn",
  },
  run(doc): IViolation[] {
    const violations: IViolation[] = [];
    const openapiDoc = doc as TOpenApi3Doc;

    if (!openapiDoc.paths || typeof openapiDoc.paths !== "object") return violations;

    for (const [pathKey, pathItem] of Object.entries(openapiDoc.paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;

    for (const method of HTTP_METHODS) {
      if (!(method in (pathItem as Record<string, unknown>))) continue;
      const rawOp = (pathItem as Record<string, unknown>)[method];
      const operation = (typeof rawOp === "object" && rawOp !== null ? rawOp : {}) as any;

      const responses = operation.responses || {};

      // 1. If 429 response is declared, verify it declares Retry-After or RateLimit headers
      if (responses["429"]) {
        const resp429 = responses["429"];
        const headers = resp429.headers || {};
        const headerNames = Object.keys(headers).map((h) => h.toLowerCase());
        const hasRateLimitHeader = headerNames.some(
          (h) => h === "retry-after" || h.startsWith("ratelimit-") || h.startsWith("x-ratelimit-")
        );

        if (!hasRateLimitHeader) {
          violations.push({
            ruleId: "require-rate-limiting",
            severity: ESeverity.Warning,
            message: `Operation ${method.toUpperCase()} ${pathKey} defines a 429 response but lacks a "Retry-After" or rate-limiting header definition.`,
            path: `paths.${pathKey}.${method}.responses.429`,
          });
        }
      } else if (MUTATING_METHODS.includes(method as any)) {
        // 2. Mutating operations should document rate limiting
        const allResponses = Object.values(responses) as any[];
        const hasAnyRateLimitHeader = allResponses.some((r) => {
          if (!r || !r.headers) return false;
          return Object.keys(r.headers).some((h) => {
            const lower = h.toLowerCase();
            return lower === "retry-after" || lower.startsWith("ratelimit-") || lower.startsWith("x-ratelimit-");
          });
        });

        if (!hasAnyRateLimitHeader) {
          violations.push({
            ruleId: "require-rate-limiting",
            severity: ESeverity.Warning,
            message: `Mutating operation ${method.toUpperCase()} ${pathKey} should define a 429 response code or rate-limiting headers.`,
            path: `paths.${pathKey}.${method}.responses`,
          });
        }
      }
    }
  }

    return violations;
  },
};
