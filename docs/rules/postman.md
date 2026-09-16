# Postman Rules Reference

These rules run when `smile lint` detects a Postman Collection
(a JSON file whose `info.schema` field contains `schema.getpostman.com`).
Both v2.0.0 and v2.1.0 collection formats are supported.

All rules are active by default.

---

## require-request-description

**Severity:** Error

Every request in the collection must have a `description` field explaining
what the endpoint does, what inputs it expects, and what it returns.
Undocumented requests force consumers to guess the contract from the URL alone.

**Triggers on:**
```json
{
  "name": "Create User",
  "request": {
    "method": "POST",
    "url": "https://api.example.com/users"
  }
}
```

**Clean:**
```json
{
  "name": "Create User",
  "request": {
    "method": "POST",
    "url": "https://api.example.com/users",
    "description": "Creates a new user account. Requires name and email in the body."
  }
}
```

---

## no-empty-folders

**Severity:** Warning

Folders (items with an `item` array) must contain at least one request.
Empty folders are dead weight in the collection — they add noise and usually
indicate a partially migrated or abandoned feature.

**Triggers on:**
```json
{
  "name": "Legacy Endpoints",
  "item": []
}
```

**Clean:**
```json
{
  "name": "Legacy Endpoints",
  "item": [
    { "name": "Get Legacy Data", "request": { ... } }
  ]
}
```

---

## require-response-example

**Severity:** Error

Every request must have at least one saved response example in the `response`
array. This rule exists for two reasons:

1. **Documentation:** Examples are the clearest possible contract for what a
   successful response looks like.
2. **Runtime Validation:** The Breaching Detector uses these saved
   examples to validate live HTTP responses against. Without examples, runtime
   validation cannot run.

**Triggers on:**
```json
{
  "name": "Get User",
  "request": { ... },
  "response": []
}
```

**Clean:**
```json
{
  "name": "Get User",
  "request": { ... },
  "response": [
    {
      "name": "200 OK",
      "code": 200,
      "body": "{\"id\": \"1\", \"name\": \"John\"}"
    }
  ]
}
```

---

## require-collection-description

**Severity:** Error

Every Postman collection must have an `info.description` field explaining the purpose
of the collection, API target environments, or prerequisites. Collections without
descriptions lack necessary context for team onboarding and documentation portals.

**Triggers on:**
```json
{
  "info": {
    "name": "Billing API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  }
}
```

**Clean:**
```json
{
  "info": {
    "name": "Billing API",
    "description": "Endpoints and workflows for subscription billing, invoicing, and payment processing.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  }
}
```

---

## valid-request-urls

**Severity:** Error

Every request in the collection must define a non-empty, valid URL. Requests with missing
or empty URLs cannot be executed by automated test runners or runtime verification tools.

**Triggers on:**
```json
{
  "name": "Get Status",
  "request": {
    "method": "GET",
    "url": ""
  }
}
```

**Clean:**
```json
{
  "name": "Get Status",
  "request": {
    "method": "GET",
    "url": "{{baseUrl}}/health"
  }
}
```

