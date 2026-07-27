import $RefParser from "@apidevtools/json-schema-ref-parser";
import { ESpecFormat } from "../models/index.js";
import { detectSpecFormat } from "./detectSpecFormat.js";
import { readFileSync } from "node:fs";

export interface IBundleResult {
  format: ESpecFormat;
  bundledData: unknown; // The fully dereferenced/bundled object
  skipped?: boolean;
  message?: string;
}

/**
 * Bundles a multi-file API specification into a single JSON object.
 * Replaces all external $ref pointers with internal #/... references.
 *
 * @param sourcePath Path to the root spec file (OpenAPI, AsyncAPI, JSON Schema).
 */
export async function bundleSpec(sourcePath: string): Promise<IBundleResult> {
  const format = detectSpecFormat(sourcePath);

  // GraphQL does not use $ref natively. We just return it as skipped.
  if (format === ESpecFormat.GraphQL) {
    return {
      format,
      bundledData: null,
      skipped: true,
      message: "GraphQL specifications do not use $ref mathematically. Bundling is not applicable.",
    };
  }

  try {
    // json-schema-ref-parser natively handles OpenAPI, AsyncAPI, and JSON Schema
    const parser = new $RefParser();
    const bundledData = await parser.bundle(sourcePath);

    return {
      format,
      bundledData,
      skipped: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to bundle specification: ${message}`);
  }
}
