import { describe, it, expect } from "vitest";
import { bundleSpec } from "../bundler.js";
import { ESpecFormat } from "../../models/index.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundleTestDir = path.resolve(__dirname, "../../../examples/bundle-test");
const examplesDir = path.resolve(__dirname, "../../../examples");

describe("bundleSpec", () => {
  it("bundles a multi-file OpenAPI spec correctly", async () => {
    const sourcePath = path.join(bundleTestDir, "main.yaml");
    const result = await bundleSpec(sourcePath);

    expect(result.format).toBe(ESpecFormat.OpenApi);
    expect(result.skipped).toBe(false);

    const bundled = result.bundledData as any;
    
    const schema = bundled.paths["/users"].get.responses["200"].content["application/json"].schema;
    expect(schema.type).toBe("object");
    expect(schema.properties.id.type).toBe("string");
  });

  it("skips GraphQL seamlessly", async () => {
    const sourcePath = path.join(examplesDir, "sample-graphql.graphql");
    const result = await bundleSpec(sourcePath);

    expect(result.format).toBe(ESpecFormat.GraphQL);
    expect(result.skipped).toBe(true);
    expect(result.bundledData).toBeNull();
    expect(result.message).toContain("not applicable");
  });
});
