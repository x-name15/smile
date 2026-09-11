/**
 * @fileoverview OASIS SARIF (Static Analysis Results Interchange Format) v2.1.0 reporter.
 * Generates valid SARIF JSON documents suitable for GitHub Code Scanning / Security tab ingestion.
 */

import { ESeverity, type ILintResult } from "../models/index.js";
import { VERSION } from "../version.js";

interface ISarifRule {
  id: string;
  shortDescription: {
    text: string;
  };
  helpUri?: string;
  defaultConfiguration: {
    level: "error" | "warning" | "note";
  };
}

interface ISarifResult {
  ruleId: string;
  level: "error" | "warning" | "note";
  message: {
    text: string;
  };
  locations: Array<{
    physicalLocation: {
      artifactLocation: {
        uri: string;
        uriBaseId?: string;
      };
    };
  }>;
}

interface ISarifRun {
  tool: {
    driver: {
      name: string;
      version: string;
      informationUri: string;
      rules: ISarifRule[];
    };
  };
  results: ISarifResult[];
}

interface ISarifDocument {
  $schema: string;
  version: string;
  runs: ISarifRun[];
}

function mapSeverityToSarifLevel(severity: ESeverity): "error" | "warning" | "note" {
  switch (severity) {
    case ESeverity.Error:
      return "error";
    case ESeverity.Warning:
      return "warning";
    default:
      return "note";
  }
}

function buildSarifDocument(results: ILintResult[]): ISarifDocument {
  const rulesMap = new Map<string, ISarifRule>();
  const sarifResults: ISarifResult[] = [];

  for (const lintResult of results) {
    for (const v of lintResult.violations) {
      if (!rulesMap.has(v.ruleId)) {
        rulesMap.set(v.ruleId, {
          id: v.ruleId,
          shortDescription: {
            text: `Smile rule violation: ${v.ruleId}`,
          },
          helpUri: `https://github.com/x-name15/smile/blob/main/docs/rules/${lintResult.format}.md`,
          defaultConfiguration: {
            level: mapSeverityToSarifLevel(v.severity),
          },
        });
      }

      const normalizedUri = lintResult.sourcePath.replace(/\\/g, "/");

      sarifResults.push({
        ruleId: v.ruleId,
        level: mapSeverityToSarifLevel(v.severity),
        message: {
          text: v.message + (v.path ? ` at '${v.path}'` : ""),
        },
        locations: [
          {
            physicalLocation: {
              artifactLocation: {
                uri: normalizedUri,
              },
            },
          },
        ],
      });
    }
  }

  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "smile",
            version: VERSION,
            informationUri: "https://github.com/x-name15/smile",
            rules: Array.from(rulesMap.values()),
          },
        },
        results: sarifResults,
      },
    ],
  };
}

/**
 * Renders a single lint result as an OASIS SARIF v2.1.0 JSON string.
 */
export function renderSarifReport(result: ILintResult): string {
  const doc = buildSarifDocument([result]);
  return JSON.stringify(doc, null, 2);
}

/**
 * Renders multiple lint results as a single aggregated OASIS SARIF v2.1.0 JSON string.
 */
export function renderAggregateSarifReport(results: ILintResult[]): string {
  const doc = buildSarifDocument(results);
  return JSON.stringify(doc, null, 2);
}
