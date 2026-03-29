#!/bin/bash
# Hook: typecheck-on-edit (PostToolUse — Edit, Write)
# Purpose: Runs TypeScript type-check after editing .ts/.tsx files.
# Catches type errors immediately rather than waiting for CI.

# Extract file path from tool input
FILE_PATH=$(echo "$TOOL_INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')

# Only run for TypeScript files
if echo "$FILE_PATH" | grep -qE '\.(ts|tsx)$'; then
  # Run tsc with --noEmit to check types without generating output
  cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  TSC_OUTPUT=$(npx tsc --noEmit 2>&1 | head -20)
  if [ $? -ne 0 ]; then
    echo "TypeScript errors detected after editing $FILE_PATH:"
    echo "$TSC_OUTPUT"
    echo ""
    echo "Fix these type errors before continuing."
  fi
fi
