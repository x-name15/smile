import type { IPostmanCollection } from "../../../models/index.js";
import { requireRequestDescription } from "./require-request-description.js";
import { noEmptyFolders } from "./no-empty-folders.js";
import { requireResponseExample } from "./require-response-example.js";
import type { IViolation } from "../../../models/index.js";

type PostmanRule = (doc: IPostmanCollection) => IViolation[];

export const postmanRules: PostmanRule[] = [
  requireRequestDescription,
  noEmptyFolders,
  requireResponseExample,
];
