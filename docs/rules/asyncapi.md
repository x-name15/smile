# AsyncAPI Rules Reference

These rules run when `smile lint` detects an AsyncAPI 2.x spec
(a file with a top-level `asyncapi:` key).

All rules are active by default.

---

## missing-operation-id

**Severity:** Error

Every channel operation (`subscribe` or `publish`) must have an `operationId`.
Without it, code generators and SDK tools cannot produce meaningful method names.

**Triggers on:**
```yaml
channels:
  user/signedup:
    subscribe:
      message:
        payload:
          type: object
      # no operationId
```

**Clean:**
```yaml
    subscribe:
      operationId: onUserSignedUp
      message: ...
```

---

## missing-message

**Severity:** Error

Every channel operation must declare a `message` object. A channel with no
message definition cannot be validated — there is no contract for what gets
published or consumed on that channel.

**Triggers on:**
```yaml
channels:
  user/signedup:
    subscribe:
      operationId: onUserSignedUp
      # no message key
```

---

## untyped-schema-property

**Severity:** Warning

Properties inside message `payload` schemas should have a declared `type`
(or `$ref` / `oneOf` / `anyOf` / `allOf`). An untyped property cannot be
validated and produces meaningless documentation.

**Triggers on:**
```yaml
payload:
  type: object
  properties:
    metadata:   # no type
      description: Extra data
```

---

## missing-channel-description

**Severity:** Warning

Every channel should have a `description` explaining the business event it
represents. Channel descriptions explain the *why* — what triggered this event
and what it means in the domain — not just the shape of the payload.

**Triggers on:**
```yaml
channels:
  user/signedup:
    subscribe:        # no description on the channel
      operationId: onUserSignedUp
```

**Clean:**
```yaml
channels:
  user/signedup:
    description: Emitted when a new user completes registration.
    subscribe:
      operationId: onUserSignedUp
```

---

## missing-message-description

**Severity:** Warning

Every message object should have a `description` explaining the event's
context. The payload schema tells you the *shape*; the description tells you
the *meaning* — why this message exists and what a consumer should do with it.

**Triggers on:**
```yaml
subscribe:
  message:
    payload:
      type: object
    # no description on the message
```

**Clean:**
```yaml
subscribe:
  message:
    description: Fired immediately after a user creates an account. Contains the new user's ID and registration timestamp.
    payload:
      type: object
```
