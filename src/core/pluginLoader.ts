import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ISmilePlugin, ISmileCustomRule, IViolation } from "../models/index.js";
import { ESpecFormat } from "../models/index.js";

/**
 * Dynamically loads plugins defined in the configuration.
 * Resolves local paths relative to the current working directory,
 * and allows bare specifiers for npm packages.
 */
const cachedRules = new Map<string, Record<string, ISmileCustomRule>>();

export async function loadPlugins(pluginPaths: string[] = []): Promise<Record<string, ISmileCustomRule>> {
  const cacheKey = pluginPaths.join("\0");
  const cached = cachedRules.get(cacheKey);
  if (cached) return cached;

  const customRules: Record<string, ISmileCustomRule> = {};

  for (const p of pluginPaths) {
    try {
      let importPath = p;
      // If it's a relative or absolute local path, convert to a file:// URL
      // so Node's dynamic import can resolve it from anywhere reliably.
      if (p.startsWith(".") || p.startsWith("/")) {
        const absolutePath = path.resolve(process.cwd(), p);
        importPath = pathToFileURL(absolutePath).href;
      }
      
      const module = await import(importPath);
      
      // Support both CommonJS (module.exports) and ESM (export default) plugin structures
      const plugin: ISmilePlugin = module.default || module;
      
      if (!plugin.rules) {
        console.warn(`⚠️ Warning: Plugin at "${p}" does not export any "rules".`);
        continue;
      }
      
      for (const [ruleId, rule] of Object.entries(plugin.rules)) {
        customRules[ruleId] = rule;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`⚠️ Warning: Failed to load plugin at "${p}": ${msg}`);
    }
  }

  cachedRules.set(cacheKey, customRules);
  return customRules;
}

export function evaluateCustomRules(
  doc: unknown,
  format: ESpecFormat,
  customRules: Record<string, ISmileCustomRule>
): IViolation[] {
  const violations: IViolation[] = [];
  
  for (const [ruleId, rule] of Object.entries(customRules)) {
    if (rule.format === format || rule.format === "all") {
      try {
        const ruleViolations = rule.evaluate(doc);
        if (Array.isArray(ruleViolations)) {
          for (const v of ruleViolations) {
            // Force the ruleId to match the one defined in the config mapping
            v.ruleId = ruleId;
            violations.push(v);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`⚠️ Warning: Custom rule "${ruleId}" crashed during evaluation: ${msg}`);
      }
    }
  }

  return violations;
}
