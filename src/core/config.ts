import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ESeverity, ESpecFormat, type ISmileConfig, type IViolation, type RuleSeverity } from "../models/index.js";

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
 * Applies the user's configuration to a list of raw violations.
 * - Drops violations where the rule is set to "off".
 * - Overrides the severity if the rule is set to "warn" or "error".
 * - Checks nested format configurations first, then falls back to flat configuration.
 */
export function applyConfigToViolations(
  violations: IViolation[],
  config: ISmileConfig,
  format?: ESpecFormat
): IViolation[] {
  if (!config.rules || Object.keys(config.rules).length === 0) {
    return violations;
  }

  const result: IViolation[] = [];

  for (const violation of violations) {
    let configuredSeverity: RuleSeverity | undefined;

    // Check nested format config first (if format is provided)
    if (format && config.rules[format] && typeof config.rules[format] === "object") {
      configuredSeverity = (config.rules[format] as Record<string, RuleSeverity>)[violation.ruleId];
    }

    // Fallback to flat root config
    if (!configuredSeverity && typeof config.rules[violation.ruleId] === "string") {
      configuredSeverity = config.rules[violation.ruleId] as RuleSeverity;
    }

    if (configuredSeverity === "off") {
      continue; // Suppress this violation
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
