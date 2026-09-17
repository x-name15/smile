import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { runCreateRuleCommand } from "../commands/createRuleCommand.js";

describe("runCreateRuleCommand", () => {
  const testOutputDir = path.resolve(process.cwd(), "temp-test-rules");

  beforeEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it("scaffolds a TypeScript rule file with correct exports and types", async () => {
    const targetFile = path.resolve(testOutputDir, "require-team-tag.ts");

    await runCreateRuleCommand("require-team-tag", {
      format: "openapi",
      lang: "ts",
      out: targetFile,
    });

    expect(existsSync(targetFile)).toBe(true);
    const content = readFileSync(targetFile, "utf-8");

    expect(content).toContain('format: "openapi"');
    expect(content).toContain("export const requireTeamTag: ISmileCustomRule");
    expect(content).toContain('"require-team-tag": requireTeamTag');
  });

  it("scaffolds a JavaScript ESM rule file without TypeScript types", async () => {
    const targetFile = path.resolve(testOutputDir, "require-owner.mjs");

    await runCreateRuleCommand("require-owner", {
      format: "asyncapi",
      lang: "js",
      out: targetFile,
    });

    expect(existsSync(targetFile)).toBe(true);
    const content = readFileSync(targetFile, "utf-8");

    expect(content).toContain('format: "asyncapi"');
    expect(content).toContain("export const requireOwner = {");
    expect(content).toContain('"require-owner": requireOwner');
    expect(content).not.toContain(": ISmileCustomRule");
  });
});
