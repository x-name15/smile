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

  it("warns when a webhook responds with an HTTP error", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));

    await fireWebhooks(["https://hooks.example.test/ci"], { passed: false });

    expect(warning).toHaveBeenCalledWith(
      "Webhook responded with HTTP 503 for https://hooks.example.test/ci",
    );
  });
});