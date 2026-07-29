/**
 * This module contains all the string templates and default values used by the \`smile init\` command.
 * By extracting these massive strings here, we keep the main initialization logic clean and readable.
 */
export const GITHUB_WORKFLOW = `name: "Smile API Contract Validation"

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main", "develop" ]

jobs:
  lint-contract:
    name: Lint API Spec
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 22

      - name: Run Smile Linter
        # NOTE: Update "./api.yaml" to point to your actual specification file(s)
        run: npx -y @mrjacket/smile@latest lint ./api.yaml
`;

export const SAMPLE_OPENAPI = `openapi: 3.0.3
info:
  title: Sample API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get all users
      operationId: getUsers
      responses:
        '200':
          description: A list of users
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
`;

export const SAMPLE_ASYNCAPI = `asyncapi: 3.0.0
info:
  title: Sample AsyncAPI
  version: 1.0.0
channels:
  userSignup:
    address: 'user.signup'
    messages:
      userSignupEvent:
        $ref: '#/components/messages/UserSignup'
components:
  messages:
    UserSignup:
      payload:
        type: object
        properties:
          userId:
            type: string
`;

export const SAMPLE_GRAPHQL = `type Query {
  "Fetches all users"
  users: [User!]!
}

"A user in the system"
type User {
  "Unique identifier for the user"
  id: ID!
  
  "Full name of the user"
  name: String!
}
`;

export const SAMPLE_JSONSCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User Schema",
  "description": "Schema for a user object",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    }
  }
}`;

export const RULES_BY_FORMAT: Record<string, string[]> = {
  openapi: ["missing-summary", "missing-operation-id", "untyped-schema-property"],
  asyncapi: ["missing-channel-description", "missing-message-description", "untyped-schema-property"],
  graphql: ["missing-type-description", "missing-field-description", "deprecated-without-reason", "missing-enum-value-description"],
  jsonschema: ["missing-title", "missing-description", "untyped-property"],
};
