import { Command } from "commander";
import { lintSpec, runSmokeTest } from "../core/index.js";
import { renderSmileReport, renderSmileTestReport } from "../reporters/smileReporter.js";
import { VERSION } from "../version.js";

const program = new Command();

program
  .name("smile")
  .description("Strict API contract validator for OpenAPI/AsyncAPI")
  .version(VERSION);

program
  .command("lint <specPath>")
  .description("Statically lint a spec file — auto-detects OpenAPI or AsyncAPI (YAML or JSON)")
  .action(async (specPath: string) => {
    try {
      const result = await lintSpec(specPath);
      console.log(renderSmileReport(result));
      process.exitCode = result.passed ? 0 : 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to lint spec: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("test <specPath> <baseUrl>")
  .description(
    "Run the Breaching Detector: call every documented GET endpoint against baseUrl and validate real responses against the spec",
  )
  .action(async (specPath: string, baseUrl: string) => {
    try {
      const result = await runSmokeTest(specPath, baseUrl);
      console.log(renderSmileTestReport(result));
      process.exitCode = result.passed ? 0 : 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to run smoke test: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("bundle <specPath>")
  .description(
    "Bundle a multi-file spec (OpenAPI, AsyncAPI, JSON Schema) into a single, resolved JSON file.",
  )
  .option("-o, --out <outputPath>", "Output file path. If not provided, prints to stdout.")
  .action(async (specPath: string, options: { out?: string }) => {
    try {
      // Import here so we don't add overhead to other commands
      const { bundleSpec } = await import("../core/index.js");
      const { writeFileSync } = await import("node:fs");
      
      const result = await bundleSpec(specPath);

      if (result.skipped) {
        console.log(`\nℹ️  ${result.message}\n`);
        return;
      }

      const jsonStr = JSON.stringify(result.bundledData, null, 2);

      if (options.out) {
        writeFileSync(options.out, jsonStr, "utf-8");
        console.log(`\n✅ Bundled spec successfully saved to ${options.out}\n`);
      } else {
        console.log(jsonStr);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\nFailed to bundle spec: ${message}\n`);
      process.exitCode = 1;
    }
  });

program.parse();