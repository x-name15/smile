# GraphQL Rules Reference

These rules run when `smile lint` detects a GraphQL SDL file
(any file with a `.graphql` or `.gql` extension).

All rules are active by default.

---

## missing-type-description

**Severity:** Warning

Object types, interfaces, enums, and input types should have a description
block (a `"""..."""` docstring). GraphQL's introspection system exposes these
descriptions — they appear in GraphiQL, Apollo Studio, Postman, and any tool
that builds docs from the schema. Without them, your schema's type graph
is undocumented at the type level.

**Triggers on:**
```graphql
type User {
  id: ID!
  name: String!
}
```

**Clean:**
```graphql
"""
Represents a registered user in the system.
"""
type User {
  id: ID!
  name: String!
}
```

---

## missing-field-description

**Severity:** Warning

Every field on an object type or interface should have a description
(a `"..."` inline docstring or `"""..."""` block). Field descriptions appear
in IDE autocomplete, GraphiQL, and generated client documentation.
A schema where every field is anonymous is unusable without external docs.

**Triggers on:**
```graphql
type User {
  id: ID!         # no description
  name: String!   # no description
}
```

**Clean:**
```graphql
type User {
  "Unique identifier for the user."
  id: ID!
  "Full display name."
  name: String!
}
```

---

## deprecated-without-reason

**Severity:** Warning

`@deprecated` directives on fields must include a `reason` argument
explaining what the consumer should use instead. A bare `@deprecated`
gives no migration path — the consumer knows the field is going away
but has no idea what to replace it with.

**Triggers on:**
```graphql
type User {
  role: String @deprecated
}
```

**Clean:**
```graphql
type User {
  "User role — deprecated, use the permissions field."
  role: String @deprecated(reason: "Use the permissions field instead.")
}
```

---

## missing-enum-value-description

**Severity:** Warning

Individual enum values should have descriptions. GraphQL exposes enum value
descriptions through introspection — tools like Apollo Studio and GraphiQL
display them in autocomplete and schema explorers. Without descriptions,
consumers have to read external docs (or source code) to understand what
each value represents.

**Triggers on:**
```graphql
enum UserRole {
  ADMIN
  MEMBER
  GUEST
}
```

**Clean:**
```graphql
enum UserRole {
  "Full administrative access to all resources."
  ADMIN
  "Standard member with read and write access to their own data."
  MEMBER
  "Read-only access, no authentication required."
  GUEST
}
```

---

## require-pascal-case-types

**Severity:** Error

GraphQL conventions dictate that all types (Object, Input, Interface, Enum, Union) should be named using PascalCase (starting with a capital letter).

**Triggers on:**
``graphql
# Bad: lowercase start
type user {
  id: ID!
}
``

**Clean:**
``graphql
type User {
  id: ID!
}
``

---

## require-camel-case-fields

**Severity:** Error

GraphQL conventions dictate that all fields inside a type should be named using camelCase (starting with a lowercase letter). Avoid snake_case or PascalCase.

**Triggers on:**
``graphql
type User {
  # Bad: snake_case
  created_at: String
  
  # Bad: PascalCase
  FirstName: String
}
``

**Clean:**
``graphql
type User {
  createdAt: String
  firstName: String
}
``
