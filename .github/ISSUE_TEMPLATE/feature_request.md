---
name: Feature Request
about: Suggest a new rule, format, or capability for smile
title: "[FEATURE] "
labels: enhancement
assignees: ''
---

## What problem does this solve?

A clear description of the problem or gap. Explain the use case, not just the desired
solution. Example: *"When validating AsyncAPI specs, there's no rule that checks
whether channel names follow a consistent naming convention."*

## Proposed solution

A description of what you'd like to happen. If you have a concrete implementation
idea, describe it here.

Keep in mind smile's core design constraint: **`src/core/` must remain usable as a
pure library** — any new feature should be callable programmatically from a test,
not only from the CLI.

## Which part of smile does this affect?

- [ ] A new lint rule (OpenAPI)
- [ ] A new lint rule (AsyncAPI)
- [ ] Support for a new spec format
- [ ] The Breaching Detector (runtime HTTP testing)
- [ ] The reporter / output format
- [ ] The CLI interface
- [ ] The library API
- [ ] Other

## Alternatives considered

Any alternative approaches or workarounds you've already thought about.

## Additional context

Any other context, links to relevant specs or prior art, example output, etc.