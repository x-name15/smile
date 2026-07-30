import protobuf from "protobufjs";
import { ESpecFormat, type IParsedSpec } from "../models/index.js";

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
