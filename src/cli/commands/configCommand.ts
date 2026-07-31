import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig } from "../../core/index.js";

/**
 * Runs the `smile config` command.
 * Displays a clean, elegant summary of the active configuration.
 */
export async function runConfigCommand(): Promise<void> {
  console.log();
  p.intro(pc.red("Smile Configuration (The Mentalist)"));

  const config = loadConfig();

  const rules = config.rules || {};
  const ruleCount = Object.keys(rules).length;

  if (ruleCount === 0) {
    p.note(
      "No custom rules found.\nSmile is running in strict mode (default).",
      "Rules Engine"
    );
  } else {
    let rulesText = "";
    for (const [ruleId, severity] of Object.entries(rules)) {
      if (typeof severity === "string") {
        let coloredSeverity: string = severity;
        if (severity === "off") coloredSeverity = pc.dim("off");
        if (severity === "warn") coloredSeverity = pc.yellow("warn");
        if (severity === "error") coloredSeverity = pc.red("error");
        
        rulesText += `${pc.cyan(ruleId)}: ${coloredSeverity}\n`;
      } else if (typeof severity === "object") {
        rulesText += `${pc.magenta(`[${ruleId} format overrides]`)}\n`;
        for (const [subRuleId, subSeverity] of Object.entries(severity)) {
          let coloredSeverity: string = subSeverity as string;
          if (subSeverity === "off") coloredSeverity = pc.dim("off");
          if (subSeverity === "warn") coloredSeverity = pc.yellow("warn");
          if (subSeverity === "error") coloredSeverity = pc.red("error");
          
          rulesText += `  ↳ ${pc.cyan(subRuleId)}: ${coloredSeverity}\n`;
        }
      }
    }
    p.note(rulesText.trimEnd(), "Active Rule Overrides");
  }

  const plugins = config.plugins || [];
  if (plugins.length > 0) {
    const pluginsText = plugins.map(pl => `• ${pl}`).join("\n");
    p.note(pluginsText, "Loaded Plugins");
  }

  const webhooks = config.webhooks || [];
  if (webhooks.length > 0) {
    p.note(`${webhooks.length} webhook(s) configured`, "Integrations");
  }

  p.outro("Observation complete.");
}
