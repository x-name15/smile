import { describe, expect, it } from "vitest";
import { ESeverity, ESpecFormat, type ILintResult } from "../../models/index.js";
import { renderJunitReport } from "../junit.js";

describe("renderJunitReport", () => {
  it("escapes XML attributes and text", () => {
    const result: ILintResult = {
      format: ESpecFormat.OpenApi,
      passed: false,
      sourcePath: "spec&<.yaml",
      violations: [
        {
          ruleId: "bad&rule",
          severity: ESeverity.Error,
          message: 'Expected <value> & "text"',
          path: "paths./users/{id}",
        },
      ],
    };

    const xml = renderJunitReport(result);

    expect(xml).toContain("Spec Validation: spec&amp;&lt;.yaml");
    expect(xml).toContain("name=\"bad&amp;rule\"");
    expect(xml).toContain("message=\"Expected &lt;value&gt; &amp; &quot;text&quot;\"");
    expect(xml).toContain("&lt;value&gt; &amp; &quot;text&quot;");
  });
});