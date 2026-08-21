import { readFileSync } from "node:fs";
import * as asyncApiParserModule from "@asyncapi/parser";
import { ESpecFormat, type IParsedSpec } from "../models/index.js";

const asyncApiParser = (asyncApiParserModule as typeof asyncApiParserModule & {
  default?: typeof asyncApiParserModule;
}).default ?? asyncApiParserModule;

/**
 * Loads and validates an AsyncAPI spec from a file path (YAML or JSON).
 * Throws if the document isn't valid AsyncAPI.
 *
 * Uses @asyncapi/parser v1.x API — `parse(source)` returns the AsyncAPIDocument
 * directly and throws on parse errors.
 */
export async function parseAsyncApiSpec(
  sourcePath: string,
): Promise<IParsedSpec> {
  try {
    const source = readFileSync(sourcePath, "utf-8");

    // v1.x: parse() throws on invalid docs and returns an AsyncAPIDocument on success.
    const document = await asyncApiParser.parse(source);

    return {
      format: ESpecFormat.AsyncApi,
      raw: document.json(),
      sourcePath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse AsyncAPI spec: ${message}`);
  }
}