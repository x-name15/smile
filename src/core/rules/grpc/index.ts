import { type ISmileRule } from "../../../models/index.js";
import { requireRpcComments } from "./require-rpc-comments.js";
import { pascalCaseMessages } from "./pascal-case-messages.js";
import { camelCaseFields } from "./camel-case-fields.js";
import { pascalCaseServices } from "./pascal-case-services.js";
import { requireServiceComments } from "./require-service-comments.js";
import { requirePackageName } from "./require-package-name.js";

export const grpcRules: ISmileRule[] = [
  requireRpcComments,
  pascalCaseMessages,
  camelCaseFields,
  pascalCaseServices,
  requireServiceComments,
  requirePackageName,
];
