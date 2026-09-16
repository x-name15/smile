import { type ISmileRule } from "../../../models/index.js";
import { requireRequestDescription } from "./require-request-description.js";
import { noEmptyFolders } from "./no-empty-folders.js";
import { requireResponseExample } from "./require-response-example.js";
import { requireCollectionDescription } from "./require-collection-description.js";
import { validRequestUrls } from "./valid-request-urls.js";

export const postmanRules: ISmileRule[] = [
  requireRequestDescription,
  noEmptyFolders,
  requireResponseExample,
  requireCollectionDescription,
  validRequestUrls,
];
