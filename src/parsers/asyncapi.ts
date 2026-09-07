import { readFileSync } from "node:fs";
import { Parser } from "@asyncapi/parser";
import { ESpecFormat, type IParsedSpec } from "../models/index.js";

const parser = new Parser();

/**
 * Loads and validates an AsyncAPI spec from a file path (YAML or JSON).
 * Supports both AsyncAPI 2.x and 3.x documents.
 * Throws if the document isn't valid AsyncAPI or fails structural validation.
 *
 * Uses @asyncapi/parser v3.x API.
 *
 * @param sourcePath Path to the AsyncAPI specification file.
 */
export async function parseAsyncApiSpec(
  sourcePath: string,
): Promise<IParsedSpec> {
  try {
    const source = readFileSync(sourcePath, "utf-8");
    const { document, diagnostics } = await parser.parse(source);

    if (!document) {
      const errorMsg = (diagnostics || [])
        .filter((d: { severity?: number; message?: string }) => d.severity === 0)
        .map((d: { message?: string }) => d.message)
        .filter(Boolean)
        .join("; ");
      throw new Error(`Failed to parse AsyncAPI spec: ${errorMsg || "Invalid AsyncAPI document"}`);
    }

    return {
      format: ESpecFormat.AsyncApi,
      raw: document.json(),
      sourcePath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("Failed to parse AsyncAPI spec:")) {
      throw error;
    }
    throw new Error(`Failed to parse AsyncAPI spec: ${message}`);
  }
}