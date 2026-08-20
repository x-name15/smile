import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findSpecFiles } from "../utils.js";

describe("findSpecFiles", () => {
  let temporaryDirectory: string | undefined;

  afterEach(() => {
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
});