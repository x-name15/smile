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
