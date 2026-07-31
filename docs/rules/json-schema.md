# JSON Schema Rules Reference

These rules run when `smile lint` detects a JSON Schema document
(a `.json` file containing a top-level `$schema` key).

All rules are active by default.

---

## missing-title

**Severity:** Warning

The root schema object should have a `title` field. Titles are used by
documentation generators, form builders, and validation error messages
to identify what the schema represents. A schema without a title is
anonymous — it's impossible to reference meaningfully in generated docs.

**Triggers on:**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": { ... }
}
```

**Clean:**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "User",
  "type": "object",
  "properties": { ... }
}
```

---

## untyped-property

**Severity:** Warning

Every property should declare a `type` field, or use `$ref`, `oneOf`,
`anyOf`, or `allOf` as an alternative. A property with no type is
implicitly permissive — it accepts any JSON value, making validation
meaningless for that field.

**Triggers on:**
```json
{
  "properties": {
    "status": {
      "description": "Current status"
    }
  }
}
```

**Clean:**
```json
{
  "properties": {
    "status": {
      "type": "string",
      "description": "Current status"
    }
  }
}
```

---

## missing-description

**Severity:** Warning

Every property should have a `description` field explaining what the property
represents. Descriptions appear in generated documentation, IDE hover hints,
and form builders. Code that generates SDKs from schemas depends on them.

**Triggers on:**
```json
{
  "properties": {
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

**Clean:**
```json
{
  "properties": {
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of when the record was created."
    }
  }
}
```

---

## array-without-items

**Severity:** Error

Array-typed properties must define an `items` schema describing what each
element in the array contains. An array without `items` is an untyped
collection — the validator accepts `[1, "hello", null, {}]` with equal
validity, and runtime validation of array contents is impossible.

**Triggers on:**
```json
{
  "properties": {
    "tags": {
      "type": "array"
    }
  }
}
```

**Clean:**
```json
{
  "properties": {
    "tags": {
      "type": "array",
      "description": "Labels attached to this resource.",
      "items": {
        "type": "string"
      }
    }
  }
}
```

---

## require-additional-properties

**Severity:** Error

Every `type: "object"` definition should explicitly declare `"additionalProperties": false`. Without this, clients could send arbitrary data in payloads that your API may accidentally process, which poses a security risk (like Mass Assignment attacks).

**Triggers on:**
```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string"
    }
  }
}
```

**Clean:**
```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "username": {
      "type": "string"
    }
  }
}
```
