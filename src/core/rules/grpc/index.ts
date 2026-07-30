import type protobuf from "protobufjs";
import { requireRpcComments } from "./require-rpc-comments.js";
import { pascalCaseMessages } from "./pascal-case-messages.js";
import { camelCaseFields } from "./camel-case-fields.js";
import type { IViolation } from "../../../models/index.js";

type GrpcRule = (root: protobuf.Root) => IViolation[];

export const grpcRules: GrpcRule[] = [
  requireRpcComments,
  pascalCaseMessages,
  camelCaseFields,
];
