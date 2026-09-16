/**
 * Severity level for a lint violation.
 */
export enum ESeverity {
  Error = "error",
  Warning = "warning",
  Info = "info",
}

/**
 * Supported specification formats.
 */
export enum ESpecFormat {
  OpenApi = "openapi",
  AsyncApi = "asyncapi",
  JsonSchema = "json-schema",
  GraphQL = "graphql",
  Grpc = "grpc",
  Postman = "postman",
  Unknown = "unknown",
}

/**
 * Severity configuration for rules in config file.
 */
export type RuleSeverity = "error" | "warn" | "off";

/**
 * Metadata that every Smile rule carries alongside its implementation.
 * Follows the ESLint self-describing rule pattern.
 */
export interface ISmileRuleMeta {
  /** Unique identifier (e.g. 'missing-operation-id'). */
  id: string;
  /** Short human-readable label for UI display. */
  title: string;
  /** Detailed explanation of what the rule enforces. */
  description: string;
  /** Specification format this rule targets. */
  format: ESpecFormat;
  /** Built-in default severity when not overridden by config. */
  defaultSeverity: "error" | "warn";
  /** True when the rule violation can be auto-fixed by `smile lint --fix`. */
  isFixable?: boolean;
}

/**
 * Backward compatibility alias for ISmileRuleMeta.
 */
export type IRuleMetadata = ISmileRuleMeta;

/**
 * A self-describing Smile lint rule.
 * Each rule carries its own metadata (id, title, description, severity) plus its run function.
 * This eliminates the need for a separate metadata registry file.
 */
export interface ISmileRule {
  /** Static metadata about this rule. */
  meta: ISmileRuleMeta;
  /** Execute the rule against a parsed spec document and return violations. */
  run: (doc: unknown) => IViolation[];
}

/**
 * Smile configuration file interface.
 */
export interface ISmileConfig {
  plugins?: string[];
  rules?: Record<string, RuleSeverity | Record<string, RuleSeverity>>;
  webhooks?: string[];
  testHeaders?: Record<string, string>;
  requestTimeoutMs?: number;
  format?: "text" | "json" | "markdown" | "junit" | "sarif";
  maxWarnings?: number;
}

/**
 * Interface for a custom plugin loaded dynamically via config.
 */
export interface ISmilePlugin {
  rules: Record<string, ISmileCustomRule>;
}

/**
 * Interface for a custom rule provided by a plugin.
 */
export interface ISmileCustomRule {
  format: ESpecFormat | "all";
  evaluate: (specNode: unknown) => IViolation[];
}

/**
 * A single rule violation found while linting a spec.
 */
export interface IViolation {
  ruleId: string;
  severity: ESeverity;
  message: string;
  path: string;
}

/**
 * Result of running the linter against a spec.
 */
export interface ILintResult {
  format: ESpecFormat;
  passed: boolean;
  violations: IViolation[];
  sourcePath: string;
}

/**
 * A parsed specification, agnostic of its original format.
 */
export interface IParsedSpec {
  format: ESpecFormat;
  raw: unknown;
  sourcePath: string;
}

/**
 * Result of testing a single endpoint's real response against its
 * documented schema (the "Breaching Detector").
 */
export interface IEndpointTestResult {
  method: string;
  path: string;
  violations: IViolation[];
  skipped: boolean;
  skipReason?: string;
}

/**
 * Result of running the runtime smoke test suite against a live server.
 */
export interface ITestResult {
  format: ESpecFormat;
  baseUrl: string;
  passed: boolean;
  endpoints: IEndpointTestResult[];
  sourcePath: string;
}

// ─── Postman ───────────────────────────────────────────────────────────────

/**
 * Represents a single request configuration in a Postman Collection.
 */
export interface IPostmanRequest {
  method: string;
  url: string | { raw?: string };
  description?: string;
  body?: {
    mode?: string;
    raw?: string;
  };
  [key: string]: unknown;
}

/**
 * Represents a saved example response in a Postman Collection.
 */
export interface IPostmanResponse {
  name: string;
  code?: number;
  body?: string;
  [key: string]: unknown;
}

/**
 * Represents a node in the Postman Collection tree (either a folder or a request item).
 */
export interface IPostmanItem {
  name: string;
  request?: IPostmanRequest;
  response?: IPostmanResponse[];
  item?: IPostmanItem[];
}

/**
 * Represents the root structure of a Postman Collection JSON.
 */
export interface IPostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: IPostmanItem[];
  [key: string]: unknown;
}