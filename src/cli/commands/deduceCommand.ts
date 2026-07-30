import { readFileSync, writeFileSync } from "node:fs";
import * as p from "@clack/prompts";
import YAML from "yaml";
import { lintSpec, loadConfig } from "../../core/index.js";
import { ESpecFormat } from "../../models/index.js";
import type { IViolation } from "../../models/index.js";

/**
 * Parses the HTTP method and path from the standard violation message format:
 * 'Operation "GET /users/{id}" is missing ...'
 */
function extractRouteFromMessage(message: string): { method: string; path: string } | null {
  const match = message.match(/Operation "([A-Z]+) (.*?)"/);
  if (!match) return null;
  return { method: match[1].toLowerCase(), path: match[2] };
}

/**
 * Runs the interactive "Smile Deduce" CLI wizard.
 * Scans a given specification for missing values (like operation IDs or summaries),
 * prompts the user in the terminal to supply them, and uses an AST-aware YAML/JSON
 * parser to inject the fixes back into the file without altering existing formatting
 * or comments.
 * 
 * Only supported for OpenAPI and AsyncAPI specs (formats that have a `paths` structure).
 * 
 * @param specPath The path to the OpenAPI/AsyncAPI file.
 */
export async function runDeduceCommand(specPath: string): Promise<void> {
  p.intro("Welcome to Smile Deduce, Mentalist)");

  const config = loadConfig();
  const result = await lintSpec(specPath, config);

  // Deduce only works on formats that have a paths/operations structure
  const supportedFormats = [ESpecFormat.OpenApi, ESpecFormat.AsyncApi];
  if (!supportedFormats.includes(result.format)) {
    p.outro(`⚠️ Smile Deduce only supports OpenAPI and AsyncAPI specs. Detected format: "${result.format}".`);
    return;
  }

  if (result.passed && result.violations.length === 0) {
    p.outro("✅ Your spec is perfectly healthy! No deductions needed.");
    return;
  }

  // Filter for rules we know how to auto-fix
  const fixableViolations = result.violations.filter(
    (v) => v.ruleId === "missing-summary" || v.ruleId === "missing-operation-id"
  );

  if (fixableViolations.length === 0) {
    p.outro(`⚠️ You have ${result.violations.length} violation(s), but none can be deduced yet.`);
    return;
  }

  p.log.info(`Found ${fixableViolations.length} missing piece(s) of evidence. Let's deduce them!`);

  const fileContent = readFileSync(specPath, "utf-8");
  const isJson = specPath.endsWith(".json");
  
  // Use yaml to preserve comments and AST if YAML, otherwise use native JSON
  let doc: YAML.Document | null = null;
  let jsonObj: any = null;
  
  try {
    if (isJson) {
      jsonObj = JSON.parse(fileContent);
    } else {
      doc = YAML.parseDocument(fileContent);
    }
  } catch (e) {
    p.log.error(`Failed to parse ${specPath}: ${e}`);
    process.exit(1);
  }

  let changesMade = 0;

  for (const violation of fixableViolations) {
    const route = extractRouteFromMessage(violation.message);
    if (!route) {
      p.log.warn(`Could not parse route for violation: ${violation.message}`);
      continue;
    }

    if (violation.ruleId === "missing-summary") {
      const summary = await p.text({
        message: `Missing summary for ${route.method.toUpperCase()} ${route.path}. What is it?`,
        placeholder: `e.g. "Get user details"`,
      });
      if (p.isCancel(summary)) {
        p.cancel("Deduction session cancelled.");
        process.exit(0);
      }
      
      if (summary) {
        if (isJson) {
          const operation = jsonObj?.paths?.[route.path]?.[route.method];
          if (operation) {
            operation.summary = summary;
            changesMade++;
          } else {
            p.log.warn(`Could not locate operation ${route.method.toUpperCase()} ${route.path} in JSON. Skipping.`);
          }
        } else {
          doc!.setIn(["paths", route.path, route.method, "summary"], summary);
          changesMade++;
        }
      }
    } else if (violation.ruleId === "missing-operation-id") {
      const opId = await p.text({
        message: `Missing operationId for ${route.method.toUpperCase()} ${route.path}. What is it?`,
        placeholder: `e.g. "getUser"`,
      });
      if (p.isCancel(opId)) {
        p.cancel("Deduction session cancelled.");
        process.exit(0);
      }
      
      if (opId) {
        if (isJson) {
          const operation = jsonObj?.paths?.[route.path]?.[route.method];
          if (operation) {
            operation.operationId = opId;
            changesMade++;
          } else {
            p.log.warn(`Could not locate operation ${route.method.toUpperCase()} ${route.path} in JSON. Skipping.`);
          }
        } else {
          doc!.setIn(["paths", route.path, route.method, "operationId"], opId);
          changesMade++;
        }
      }
    }
  }

  if (changesMade > 0) {
    const newContent = isJson ? JSON.stringify(jsonObj, null, 2) : doc!.toString();
    writeFileSync(specPath, newContent, "utf-8");
    p.outro(`Observation finished! Applied ${changesMade} fix(es) to ${specPath}.`);
  } else {
    p.outro("No changes applied.");
  }
}
