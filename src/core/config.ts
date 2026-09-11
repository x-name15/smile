import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ESeverity, ESpecFormat, type ISmileConfig, type IViolation, type RuleSeverity } from "../models/index.js";
import YAML from "yaml";

const CONFIG_FILENAMES = ["config.smile.json", "smile.config.json", ".smilerc.json", "smile.json"];

/**
 * Attempts to locate and load a smile configuration file from the current directory.
 * Falls back to an empty configuration if not found.
 */
export function loadConfig(cwd: string = process.cwd()): ISmileConfig {
  for (const filename of CONFIG_FILENAMES) {
    const configPath = join(cwd, filename);
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, "utf-8");
        return JSON.parse(content) as ISmileConfig;
      } catch (error) {
        console.warn(`\n⚠️  Warning: Failed to parse ${filename}: ${error}\n`);
      }
    }
  }
  return {};
}

/**
 * Checks if a comment string contains an inline suppression directive for the given ruleId.
 * Supports:
 * - `# smile-ignore-next-line <ruleId>`
 * - `# smile-ignore-next-line rule-1, rule-2`
 * - `# smile-ignore-next-line all`
 * - `# smile-ignore-line <ruleId>`
 * - `# smile-ignore-line rule-1, rule-2`
 * - `# smile-ignore-line all`
 */
function isRuleSuppressedInComment(comment: string, ruleId: string): boolean {
  const lines = comment.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(/smile-ignore-(?:next-line|line)\s+(.+)$/i);
    if (!match) continue;

    const rawDirectives = match[1].trim();
    const rules = rawDirectives
      .split(/[,\s]+/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (rules.includes("all") || rules.includes(ruleId)) {
      return true;
    }
  }
  return false;
}

/**
 * Applies the user's configuration to a list of raw violations.
 * - Drops violations where the rule is set to "off".
 * - Overrides the severity if the rule is set to "warn" or "error".
 * - Checks nested format configurations first, then falls back to flat configuration.
 * - Parses AST for YAML files to drop inline suppressed violations (# smile-ignore-next-line / # smile-ignore-line).
 */
export function applyConfigToViolations(
  violations: IViolation[],
  config: ISmileConfig,
  format?: ESpecFormat,
  sourcePath?: string
): IViolation[] {
  if (violations.length === 0) {
    return [];
  }

  const activeRules = config.rules || {};

  let yamlDoc: any = null;
  if (sourcePath && (sourcePath.endsWith(".yaml") || sourcePath.endsWith(".yml"))) {
    try {
      const fileStr = readFileSync(sourcePath, "utf-8");
      yamlDoc = YAML.parseDocument(fileStr);
    } catch {
      // gracefully fail if file can't be parsed
    }
  }

  const result: IViolation[] = [];

  for (const violation of violations) {
    let configuredSeverity: RuleSeverity | undefined;

    // Check nested format config first (if format is provided)
    if (format && activeRules[format] && typeof activeRules[format] === "object") {
      configuredSeverity = (activeRules[format] as Record<string, RuleSeverity>)[violation.ruleId];
    }

    // Fallback to flat root config
    if (!configuredSeverity && typeof activeRules[violation.ruleId] === "string") {
      configuredSeverity = activeRules[violation.ruleId] as RuleSeverity;
    }

    if (configuredSeverity === "off") {
      continue; // Suppress this violation
    }

    // Check inline AST suppression for YAML
    if (yamlDoc) {
      const pathSegments = violation.path.split(".");
      let isSuppressed = false;

      let currentSegments: string[] = [...pathSegments];
      while (currentSegments.length > 0) {
        const node: any = yamlDoc.getIn(currentSegments);
        if (node) {
          const commentBefore = node.commentBefore ? String(node.commentBefore) : "";
          const comment = node.comment ? String(node.comment) : "";
          if (
            (commentBefore && isRuleSuppressedInComment(commentBefore, violation.ruleId)) ||
            (comment && isRuleSuppressedInComment(comment, violation.ruleId))
          ) {
            isSuppressed = true;
            break;
          }
        }

        // Also check Pair key and value comments if parent is a YAMLMap
        if (currentSegments.length > 1) {
          const parentSegments = currentSegments.slice(0, -1);
          const lastKey = currentSegments[currentSegments.length - 1];
          const parentMap: any = yamlDoc.getIn(parentSegments, true);
          if (parentMap && Array.isArray(parentMap.items)) {
            const pair = parentMap.items.find(
              (item: any) => item?.key?.value === lastKey || String(item?.key) === lastKey
            );
            if (pair) {
              const keyCommentBefore = pair.key?.commentBefore ? String(pair.key.commentBefore) : "";
              const keyComment = pair.key?.comment ? String(pair.key.comment) : "";
              const valCommentBefore = pair.value?.commentBefore ? String(pair.value.commentBefore) : "";
              const valComment = pair.value?.comment ? String(pair.value.comment) : "";

              if (
                (keyCommentBefore && isRuleSuppressedInComment(keyCommentBefore, violation.ruleId)) ||
                (keyComment && isRuleSuppressedInComment(keyComment, violation.ruleId)) ||
                (valCommentBefore && isRuleSuppressedInComment(valCommentBefore, violation.ruleId)) ||
                (valComment && isRuleSuppressedInComment(valComment, violation.ruleId))
              ) {
                isSuppressed = true;
                break;
              }
            }
          }
        }

        currentSegments.pop();
      }

      if (isSuppressed) {
        continue;
      }
    }

    if (configuredSeverity === "warn") {
      violation.severity = ESeverity.Warning;
    } else if (configuredSeverity === "error") {
      violation.severity = ESeverity.Error;
    }

    result.push(violation);
  }

  return result;
}
