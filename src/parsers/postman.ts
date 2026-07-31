import { readFileSync } from "node:fs";
import { ESpecFormat, type IParsedSpec, type IPostmanCollection } from "../models/index.js";

export async function parsePostmanSpec(filePath: string): Promise<IParsedSpec> {
  try {
    const contents = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(contents) as IPostmanCollection;
    
    const schema = parsed.info?.schema;
    if (!schema) {
      throw new Error("Invalid Postman Collection: Missing info.schema");
    }
    let schemaUrl: URL;
    try {
      schemaUrl = new URL(schema);
    } catch {
      throw new Error("Invalid Postman Collection: info.schema must be a valid URL");
    }
    if (schemaUrl.hostname !== "schema.getpostman.com") {
      throw new Error("Invalid Postman Collection: Unsupported info.schema host");
    }
    if (!Array.isArray(parsed.item)) {
      throw new Error("Invalid Postman Collection: 'item' must be an array");
    }

    return {
      format: ESpecFormat.Postman,
      raw: parsed,
      sourcePath: filePath,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse Postman spec: ${msg}`);
  }
}
