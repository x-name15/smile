import { describe, it, expect } from "vitest";
import { loadPlugins, evaluateCustomRules } from "../pluginLoader.js";
import { ESpecFormat, ESeverity } from "../../models/index.js";

// Reset module state before each test if possible,
// but since we cache in the module level, we might just test loading once
describe("Plugin Loader", () => {
  it("should load a valid plugin and extract rules", async () => {
    // Path relative to cwd, since the pluginLoader resolves against process.cwd()
    const plugins = ["./src/core/__tests__/__fixtures__/mock-plugin.mjs"];
    const rules = await loadPlugins(plugins);

    expect(rules["my-custom-company-rule"]).toBeDefined();
    expect(rules["my-custom-all-rule"]).toBeDefined();
    expect(rules["my-custom-company-rule"].format).toBe("openapi");
  });

  it("should gracefully handle missing plugins", async () => {
    // Calling loadPlugins with a non-existent plugin should just warn and continue
    // (We'll get the cached rules from the first test, but that's fine for testing the structure)
    const plugins = ["./does-not-exist.js"];
    const rules = await loadPlugins(plugins);
    
    // It should just return whatever is cached, or skip the bad one.
    expect(rules).toBeDefined();
  });

  it("evaluateCustomRules should properly evaluate format-specific rules", async () => {
    const rules = await loadPlugins(["./src/core/__tests__/__fixtures__/mock-plugin.mjs"]);
    
    // Evaluate against a mock openapi doc
    const doc = { info: { title: "bad" } };
    
    const violations = evaluateCustomRules(doc, ESpecFormat.OpenApi, rules);
    
    // Expect 2 violations: the specific rule and the 'all' rule
    expect(violations.length).toBe(2);
    
    const errorViolation = violations.find(v => v.severity === ESeverity.Error);
    expect(errorViolation?.ruleId).toBe("my-custom-company-rule");
    expect(errorViolation?.message).toContain("must have a valid title");
    
    const warningViolation = violations.find(v => v.severity === ESeverity.Warning);
    expect(warningViolation?.ruleId).toBe("my-custom-all-rule");
  });

  it("evaluateCustomRules should skip rules not targeting the specific format", async () => {
    const rules = await loadPlugins(["./src/core/__tests__/__fixtures__/mock-plugin.mjs"]);
    
    const doc = { info: { title: "bad" } };
    // Evaluating against AsyncApi instead of OpenApi
    const violations = evaluateCustomRules(doc, ESpecFormat.AsyncApi, rules);
    
    // Expect only the 'all' rule
    expect(violations.length).toBe(1);
    expect(violations[0].ruleId).toBe("my-custom-all-rule");
  });
});
