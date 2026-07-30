# gRPC Rules Reference

These rules run when `smile lint` detects a gRPC spec
(any file with a `.proto` extension).

All rules are active by default.

---

## require-rpc-comments

**Severity:** Error

Every `rpc` method inside a `service` must have a block comment (`/* ... */`)
describing what it does. Undocumented RPC methods leave consumers with no way
to understand the contract without reading the source implementation.

**Triggers on:**
```protobuf
service UserService {
  rpc GetUser (GetUserRequest) returns (User) {}
}
```

**Clean:**
```protobuf
service UserService {
  /* Returns a single user by their unique ID. */
  rpc GetUser (GetUserRequest) returns (User) {}
}
```

---

## pascal-case-messages

**Severity:** Error

All `message` definitions must use `PascalCase` naming. This is the official
convention for Protocol Buffers (as defined by the Google Protobuf Style Guide)
and is enforced by most gRPC code generators. Deviating from it produces
inconsistently-named generated classes in target languages.

**Triggers on:**
```protobuf
message getUserRequest {
  string id = 1;
}
```

**Clean:**
```protobuf
message GetUserRequest {
  string id = 1;
}
```

---

## camel-case-fields

**Severity:** Error

All fields within a `message` must use `camelCase` naming. While the proto
wire format is agnostic, the generated code in languages like Go, Java, and
TypeScript will use camelCase accessors. Using underscores or PascalCase in
field names leads to confusing discrepancies between the `.proto` definition
and the generated client.

**Triggers on:**
```protobuf
message User {
  string User_Name = 1;
}
```

**Clean:**
```protobuf
message User {
  string userName = 1;
}
```
