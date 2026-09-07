import protobuf from "protobufjs";
import { ESpecFormat, type IParsedSpec } from "../models/index.js";

/**
 * Loads and parses a gRPC `.proto` file into a `protobufjs` Root object.
 *
 * Uses `keepCase: true` to preserve the original field casing as written in
 * the proto source, and `alternateCommentMode: true` to capture leading `//`
 * comments so lint rules can inspect them (e.g. `require-rpc-comments`).
 *
 * Throws if the file cannot be read or contains syntax errors.
 *
 * @param filePath Absolute or relative path to the `.proto` file.
 */
export async function parseGrpcSpec(filePath: string): Promise<IParsedSpec> {
  try {
    const root = new protobuf.Root();
    const parsed = await root.load(filePath, { keepCase: true, alternateCommentMode: true });
    return {
      format: ESpecFormat.Grpc,
      raw: parsed,
      sourcePath: filePath,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse gRPC spec: ${msg}`);
  }
}
