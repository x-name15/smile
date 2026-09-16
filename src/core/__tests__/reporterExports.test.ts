import { describe, it, expect } from "vitest";
import {
  VERSION,
  findSpecFiles,
  parseOpenApiSpec,
  parseAsyncApiSpec,
  parseJsonSchemaSpec,
  parseGraphQLSpec,
  parseGrpcSpec,
  parsePostmanSpec,
  renderSmileReport,
  renderAggregateSmileReport,
  renderSmileTestReport,
  renderMarkdownReport,
  renderMarkdownTestReport,
  renderJunitReport,
  renderAggregateJunitReport,
  renderJunitTestReport,
  renderSarifReport,
  renderAggregateSarifReport,
  validateAsyncApiMessage,
  fixSpecFile,
  formatViolation,
  emitCIAnnotations,
  emitGithubStepSummary,
  SMILE_RULES_METADATA,
} from "../index.js";

describe("Core library public API exports", () => {
  it("exports canonical SMILE_RULES_METADATA registry with 42 rules", () => {
    expect(Array.isArray(SMILE_RULES_METADATA)).toBe(true);
    expect(SMILE_RULES_METADATA).toHaveLength(42);
  });
  it("exports VERSION string matching package release", () => {
    expect(typeof VERSION).toBe("string");
    expect(VERSION).toBe("1.7.5");
  });

  it("exports findSpecFiles directory scanner", () => {
    expect(typeof findSpecFiles).toBe("function");
  });

  it("exports format parsers directly from core entry point", () => {
    expect(typeof parseOpenApiSpec).toBe("function");
    expect(typeof parseAsyncApiSpec).toBe("function");
    expect(typeof parseJsonSchemaSpec).toBe("function");
    expect(typeof parseGraphQLSpec).toBe("function");
    expect(typeof parseGrpcSpec).toBe("function");
    expect(typeof parsePostmanSpec).toBe("function");
  });

  it("exports all CLI, Markdown, JUnit, and SARIF reporters directly from core entry point", () => {
    expect(typeof renderSmileReport).toBe("function");
    expect(typeof renderAggregateSmileReport).toBe("function");
    expect(typeof renderSmileTestReport).toBe("function");
    expect(typeof renderMarkdownReport).toBe("function");
    expect(typeof renderMarkdownTestReport).toBe("function");
    expect(typeof renderJunitReport).toBe("function");
    expect(typeof renderAggregateJunitReport).toBe("function");
    expect(typeof renderJunitTestReport).toBe("function");
    expect(typeof renderSarifReport).toBe("function");
    expect(typeof renderAggregateSarifReport).toBe("function");
    expect(typeof formatViolation).toBe("function");
    expect(typeof emitCIAnnotations).toBe("function");
    expect(typeof emitGithubStepSummary).toBe("function");
  });

  it("exports AsyncAPI runtime message validator and safe autofix engine", () => {
    expect(typeof validateAsyncApiMessage).toBe("function");
    expect(typeof fixSpecFile).toBe("function");
  });
});