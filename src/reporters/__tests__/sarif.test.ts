import { describe, it, expect } from "vitest";
import { renderSarifReport, renderAggregateSarifReport } from "../sarif.js";
import { ESeverity, ESpecFormat, type ILintResult } from "../../models/index.js";
import { VERSION } from "../../version.js";

describe("SARIF OASIS v2.1.0 Reporter", () => {
  const sampleResult: ILintResult = {
    format: ESpecFormat.OpenApi,
    passed: false,
    sourcePath: "specs\\petstore.yaml",
    violations: [
      {
        ruleId: "missing-operation-id",
        severity: ESeverity.Error,
        message: 'Operation "GET /pets" is missing an operationId',
        path: "paths./pets.get",
      },
      {
        ruleId: "missing-summary",
        severity: ESeverity.Warning,
        message: 'Operation "GET /pets" is missing a summary',
        path: "paths./pets.get",
      },
    ],
  };

  const cleanResult: ILintResult = {
    format: ESpecFormat.AsyncApi,
    passed: true,
    sourcePath: "specs/events.yaml",
    violations: [],
  };

  it("renders a valid SARIF v2.1.0 JSON document for a single result", () => {
    const raw = renderSarifReport(sampleResult);
    const parsed = JSON.parse(raw);

    expect(parsed.$schema).toBe("https://json.schemastore.org/sarif-2.1.0.json");
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs).toHaveLength(1);

    const run = parsed.runs[0];
    expect(run.tool.driver.name).toBe("smile");
    expect(run.tool.driver.version).toBe(VERSION);
    expect(run.tool.driver.rules).toHaveLength(2);
    expect(run.tool.driver.rules.map((r: { id: string }) => r.id)).toEqual([
      "missing-operation-id",
      "missing-summary",
    ]);

    expect(run.results).toHaveLength(2);
    expect(run.results[0].ruleId).toBe("missing-operation-id");
    expect(run.results[0].level).toBe("error");
    expect(run.results[0].locations[0].physicalLocation.artifactLocation.uri).toBe("specs/petstore.yaml");

    expect(run.results[1].ruleId).toBe("missing-summary");
    expect(run.results[1].level).toBe("warning");
  });

  it("renders empty results array for completely clean specs", () => {
    const raw = renderSarifReport(cleanResult);
    const parsed = JSON.parse(raw);

    expect(parsed.runs[0].results).toHaveLength(0);
    expect(parsed.runs[0].tool.driver.rules).toHaveLength(0);
  });

  it("aggregates multiple specs into a unified SARIF document", () => {
    const raw = renderAggregateSarifReport([sampleResult, cleanResult]);
    const parsed = JSON.parse(raw);

    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0].results).toHaveLength(2);
  });
});
