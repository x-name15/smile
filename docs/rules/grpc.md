# gRPC Rules Reference

These rules run when `smile lint` detects a gRPC spec
(any file with a `.proto` extension).

All rules are active by default.

---

## require-rpc-comments

**Severity:** Error

Every `rpc` method inside a `service` must have a doc comment (`// ...` or `/* ... */`)
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

---

## pascal-case-services

**Severity:** Error

All `service` definitions must use `PascalCase` naming. This adheres to the official
Google Protobuf Style Guide and industry linters (like Buf). It ensures that client
stubs and server interfaces in target languages follow idiomatic class naming.

**Triggers on:**
```protobuf
service user_service {
  rpc GetUser (GetUserRequest) returns (User) {}
}
```

**Clean:**
```protobuf
service UserService {
  rpc GetUser (GetUserRequest) returns (User) {}
}
```

---

## require-service-comments

**Severity:** Error

Every `service` definition must have a documentation comment (`// ...` or `/* ... */`)
describing its purpose. Documenting the service contract provides essential high-level
context to consumers and API documentation portals.

**Triggers on:**
```protobuf
service UserService {
  rpc GetUser (GetUserRequest) returns (User) {}
}
```

**Clean:**
```protobuf
/* Manages user accounts, authentication profiles, and identity lifecycle. */
service UserService {
  rpc GetUser (GetUserRequest) returns (User) {}
}
```

---

## require-package-name

**Severity:** Error

Every Protocol Buffer specification must declare an explicit `package` name.
Omitting the package declaration places all definitions into the global namespace,
leading to symbol collisions across imports and incompatible code generation across
different target languages.

**Triggers on:**
```protobuf
syntax = "proto3";

service UserService {}
```

**Clean:**
```protobuf
syntax = "proto3";

package com.company.users.v1;

service UserService {}
```

