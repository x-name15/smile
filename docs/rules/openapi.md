# OpenAPI Rules Reference

These rules run when `smile lint` detects an OpenAPI 3.x spec
(a file with a top-level `openapi:` key).

All rules are active by default. Custom rule configuration is on the roadmap.

---

## missing-operation-id

**Severity:** Error

Every operation (path + HTTP method combination) must have a unique
`operationId`. Without it, code generators, SDKs, and API tooling
cannot produce named functions and are forced to generate
ugly `get_users_id_get`-style names — or fail entirely.

**Triggers on:**
```yaml
paths:
  /users:
    get:
      responses:         # no operationId here
        "200":
          description: OK
```

**Clean:**
```yaml
paths:
  /users:
    get:
      operationId: listUsers
      responses:
        "200":
          description: OK
```

---

## missing-responses

**Severity:** Error

Every operation must have a `responses` object with at least one declared
response code. An operation with no responses is an incomplete contract — it
cannot be validated at runtime and cannot be used by generators.

**Triggers on:**
```yaml
paths:
  /users:
    get:
      operationId: listUsers
      # no responses key at all
```

---

## no-2xx-response

**Severity:** Error

Every operation must define at least one 2xx success response (`200`, `201`,
`204`, `2XX`, etc.). Operations that only declare error responses (`400`, `404`,
`500`) have no documented happy path — the Breaching Detector cannot validate
the success body, and consumers don't know what a successful call looks like.

**Triggers on:**
```yaml
paths:
  /users:
    delete:
      operationId: deleteUser
      responses:
        "404":
          description: Not found
        # no 200/204 here
```

**Clean:**
```yaml
      responses:
        "204":
          description: Deleted successfully
        "404":
          description: Not found
```

---

## missing-summary

**Severity:** Warning

Every operation should have a `summary` — a single short line (≤120 chars)
describing what it does. Summaries are the primary text shown in generated
docs, Postman imports, and most API tooling. Without them, endpoints appear
as anonymous HTTP method + path combinations.

**Triggers on:**
```yaml
paths:
  /users:
    get:
      operationId: listUsers
      # no summary
```

**Clean:**
```yaml
      operationId: listUsers
      summary: List all users
```

---

## untyped-schema-property

**Severity:** Warning

Every property in a `components/schemas` object should declare a `type`
(or use `$ref`, `oneOf`, `anyOf`, or `allOf` as a valid alternative).
A property with no type cannot be validated by AJV or any JSON Schema
validator — it is effectively permissive, accepting any value.

**Triggers on:**
```yaml
components:
  schemas:
    User:
      type: object
      properties:
        metadata:    # no type here
          description: Additional info
```

**Clean:**
```yaml
        metadata:
          type: object
          description: Additional info
```

---

## valid-examples

**Severity:** Error

Every `example` and `default` value must strictly match its own schema `type`. 
An example that violates its own schema type confuses consumers and breaks auto-mocking tools.

**Triggers on:**
```yaml
components:
  schemas:
    User:
      type: object
      properties:
        age:
          type: integer
          example: "twenty"  # wrong type
```

---

## require-security

**Severity:** Error

Every operation must have a `security` requirement defined (either at the root level or operation level).
If an endpoint is truly meant to be public, you must explicitly declare it with `security: []`.
This prevents accidental exposure of private endpoints.

**Triggers on:**
```yaml
paths:
  /users:
    get:
      # No security defined globally or here
      responses:
        "200":
          description: OK
```

**Clean:**
```yaml
paths:
  /users:
    get:
      security: []  # explicitly public
      responses:
        "200":
          description: OK
```

---

## no-http-verbs-in-path

**Severity:** Warning

Paths should represent resources (nouns), not actions (verbs). HTTP methods (`GET`, `POST`, `DELETE`) already define the action. Using verbs in the path violates RESTful design principles.

**Triggers on:**
```yaml
paths:
  /getUsers:
    get:
      responses:
        "200":
          description: OK
```

**Clean:**
```yaml
paths:
  /users:
    get:
      responses:
        "200":
          description: OK
```

---

## strict-hypermedia

**Severity:** Error

If a response specifies `application/vnd.api+json` (JSON:API) or `application/hal+json` (HAL), this rule enforces that the OpenAPI schema structurally aligns with the hypermedia standard.
- For **JSON:API**, the schema must define at least one of `data`, `meta`, or `errors` at the root.
- For **HAL**, the schema must define a `_links` object at the root.

> **💡 Automatic Opt-In (Zero Config):** This rule is completely invisible for standard REST APIs. It only activates if `smile` detects that you are explicitly declaring `application/vnd.api+json` or `application/hal+json` in your OpenAPI spec. If you use standard `application/json`, this rule stays dormant.

**Triggers on:**
```yaml
paths:
  /users:
    get:
      responses:
        "200":
          description: OK
          content:
            application/vnd.api+json:
              schema:
                type: object
                properties:
                  username:    # Missing 'data', 'meta', or 'errors'
                    type: string
```

**Clean:**
```yaml
paths:
  /users:
    get:
      responses:
        "200":
          description: OK
          content:
            application/vnd.api+json:
              schema:
                type: object
                properties:
                  data:
                    type: object
```

---

## valid-path-parameters

**Severity:** Error

Every parameter that appears in a path template (e.g., `{id}` in `/users/{id}`) must be explicitly defined in the `parameters` array (either at the path level or the operation level). Failing to document path parameters leads to broken SDK generation and allows unvalidated input to hit the backend.

**Triggers on:**
```yaml
paths:
  /users/{id}:
    get:
      operationId: getUser
      # 🚫 Missing parameters array defining 'id'
      responses:
        '200':
          description: ok
```

**Clean:**
```yaml
paths:
  /users/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      operationId: getUser
      responses:
        '200':
          description: ok
```
