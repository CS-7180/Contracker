---
name: No Claude branding anywhere
description: Never add any Claude/AI attribution to commits, PRs, or comments
type: feedback
---

Do not add any Claude branding in any form:
- No `Co-Authored-By: Claude Sonnet ...` in commit messages
- No `🤖 Generated with [Claude Code](https://claude.ai/claude-code)` in PR bodies
- No AI attribution in issue comments or any GitHub output

**Why:** User preference — keep all commits, PRs, and comments clean and professional with no AI tool attribution.

**How to apply:** Strip all Claude/AI co-author and footer lines from every git commit message, `gh pr create` body, and GitHub MCP tool calls.
