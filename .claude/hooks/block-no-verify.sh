#!/bin/bash
# Hook: block-no-verify (PreToolUse — Bash)
# Purpose: Prevents --no-verify flag on git commands to protect pre-commit hooks.
# This enforces TDD commit discipline — fix the issue, don't bypass the check.

if echo "$TOOL_INPUT" | grep -q -- '--no-verify'; then
  echo "BLOCK: --no-verify is not allowed. Fix the underlying issue instead of bypassing pre-commit hooks. TDD discipline requires all hooks to pass."
fi
