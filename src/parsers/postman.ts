import { readFileSync } from "node:fs";
import { ESpecFormat, type IParsedSpec } from "../models/index.js";

export interface IPostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: any[];
  [key: string]: any;
}

export async function parsePostmanSpec(filePath: string): Promise<IParsedSpec> {
  try {
    const contents = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(contents) as IPostmanCollection;
    
    if (!parsed.info || !parsed.info.schema || !parsed.info.schema.includes("schema.getpostman.com")) {
      throw new Error("Invalid Postman Collection: Missing info.schema");
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
