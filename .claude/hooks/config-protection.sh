#!/bin/bash
# Hook: config-protection (PreToolUse — Edit, Write)
# Purpose: Prevents modifications to linter/formatter/build config files.
# Steers the agent to fix code to match the config, not weaken the config.

PROTECTED_FILES=(
  ".eslintrc"
  "eslint.config"
  ".prettierrc"
  "prettier.config"
  "vitest.config"
  "tailwind.config"
  "next.config"
  "tsconfig.json"
  "postcss.config"
)

for pattern in "${PROTECTED_FILES[@]}"; do
  if echo "$TOOL_INPUT" | grep -q "$pattern"; then
    echo "BLOCK: Modifying config file ($pattern) is not allowed. Fix the code to match the config, not the other way around. If you genuinely need a config change, ask the user first."
    exit 0
  fi
done
