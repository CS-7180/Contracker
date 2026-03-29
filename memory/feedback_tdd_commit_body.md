---
name: TDD commit body format
description: All TDD commits must include a detailed body showing test pass/fail state at commit time
type: feedback
---

Every `test:` (RED) and `feat:`/`refactor:` (GREEN/REFACTOR) TDD commit must include a body that documents the test results **at the time of that commit**.

**Why:** Keeps the git log as a readable audit trail of the TDD cycle. Other commits in the repo follow this pattern consistently.

**How to apply:**

### RED commit body format (`test:` commit)
```
test: add failing tests for [feature] (TDD RED)
Issue #N — [milestone] description

Tests written BEFORE implementation per TDD protocol. [Brief explanation of what's failing and why.]

Test results at commit time (TDD RED state):
  ✅ X passed  — [brief reason]
  ❌ Y failed  — [brief reason — expected RED failures]

Failing tests (RED — these drive the implementation):
  ✗ Suite > test name
  ✗ Suite > test name

Passing tests (GREEN — already satisfied):
  ✓ Suite > test name
  ✓ Suite > test name

Next step: GREEN commit — [what to implement to turn red tests green].
```

### GREEN commit body format (`feat:` commit)
```
feat: implement [feature] to pass tests (TDD GREEN)
Issue #N — [milestone] description

Final test results: X/X PASSED — 0 failed — 0 todo

Full breakdown:
  Suite Name (X/X)
    ✓ test name
    ✓ test name
  Suite Name (X/X)
    ✓ test name
```
