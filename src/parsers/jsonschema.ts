import { readFileSync } from "node:fs";
import { ESpecFormat, type IParsedSpec } from "../models/index.js";

/**
 * Parses a JSON Schema document from a JSON file.
 * Throws if the file is not valid JSON or is not a root object.
 *
 * Note: YAML JSON Schemas (.yaml) are not yet supported — use .json format.
 */
export async function parseJsonSchemaSpec(
  sourcePath: string,
): Promise<IParsedSpec> {
  const source = readFileSync(sourcePath, "utf-8");

  let document: Record<string, unknown>;
  try {
    document = JSON.parse(source) as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON Schema: could not parse "${sourcePath}" as JSON`);
  }

  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new Error(`Invalid JSON Schema: root must be an object, got ${Array.isArray(document) ? "array" : typeof document}`);
  }

  return {
    format: ESpecFormat.JsonSchema,
    raw: document,
    sourcePath,
  };
}
