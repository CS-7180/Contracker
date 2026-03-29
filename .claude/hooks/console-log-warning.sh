#!/bin/bash
# Hook: console-log-warning (PostToolUse — Edit, Write)
# Purpose: Warns about console.log statements left in edited files.
# Keeps production code clean — use proper logging or remove debug statements.

# Extract file path from tool input
FILE_PATH=$(echo "$TOOL_INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')

# Only check TypeScript/JavaScript files (skip test files)
if echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$' && ! echo "$FILE_PATH" | grep -qE '(\.test\.|\.spec\.|__tests__)'; then
  if [ -f "$FILE_PATH" ]; then
    LOG_COUNT=$(grep -c 'console\.log' "$FILE_PATH" 2>/dev/null || echo "0")
    if [ "$LOG_COUNT" -gt 0 ]; then
      echo "Warning: $LOG_COUNT console.log statement(s) found in $FILE_PATH. Remove before committing — use Sentry for error tracking instead."
    fi
  fi
fi
