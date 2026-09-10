import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findSpecFiles, fireWebhooks } from "../utils.js";

describe("findSpecFiles", () => {
  let temporaryDirectory: string | undefined;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it("discovers gRPC proto files in a directory", () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-utils-"));
    const nestedDirectory = join(temporaryDirectory, "apis");
    mkdirSync(nestedDirectory);
    const protoPath = join(nestedDirectory, "service.proto");
    writeFileSync(protoPath, "syntax = \"proto3\";");

    expect(findSpecFiles(temporaryDirectory)).toEqual([protoPath]);
  });

  it("automatically ignores build folders, dotfiles, lockfiles, and tsconfig files", () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-utils-"));
    
    // Non-spec files that should be ignored
    writeFileSync(join(temporaryDirectory, "tsconfig.json"), "{}");
    writeFileSync(join(temporaryDirectory, "tsconfig.build.json"), "{}");
    writeFileSync(join(temporaryDirectory, "pnpm-lock.yaml"), "lockfileVersion: '9.0'");
    writeFileSync(join(temporaryDirectory, "yarn.lock"), "");
    writeFileSync(join(temporaryDirectory, "package-lock.json"), "{}");
    writeFileSync(join(temporaryDirectory, "turbo.json"), "{}");
    writeFileSync(join(temporaryDirectory, ".eslintrc.json"), "{}");

    // Ignored build folder
    const distDir = join(temporaryDirectory, "dist");
    mkdirSync(distDir);
    writeFileSync(join(distDir, "output.json"), "{}");

    // Valid spec files
    const specYaml = join(temporaryDirectory, "openapi.yaml");
    writeFileSync(specYaml, "openapi: 3.0.0");
    const specJson = join(temporaryDirectory, "schema.json");
    writeFileSync(specJson, '{"$schema": "https://json-schema.org/draft/2020-12/schema"}');

    const discovered = findSpecFiles(temporaryDirectory);
    expect(discovered.sort()).toEqual([specJson, specYaml].sort());
  });

  it("respects .gitignore patterns when discovering files", () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "smile-utils-"));
    
    writeFileSync(join(temporaryDirectory, ".gitignore"), "custom-ignore/\nignored-spec.yaml\n");
    
    const ignoredDir = join(temporaryDirectory, "custom-ignore");
    mkdirSync(ignoredDir);
    writeFileSync(join(ignoredDir, "api.yaml"), "openapi: 3.0.0");

    writeFileSync(join(temporaryDirectory, "ignored-spec.yaml"), "openapi: 3.0.0");

    const validSpec = join(temporaryDirectory, "valid.yaml");
    writeFileSync(validSpec, "openapi: 3.0.0");

    expect(findSpecFiles(temporaryDirectory)).toEqual([validSpec]);
  });

  it("warns when a webhook responds with an HTTP error", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));

    await fireWebhooks(["https://hooks.example.test/ci"], { passed: false });

    expect(warning).toHaveBeenCalledWith(
      "Webhook responded with HTTP 503 for https://hooks.example.test/ci",
    );
  });
});