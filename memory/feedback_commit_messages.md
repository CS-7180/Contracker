---
name: commit_message_format
description: Commit messages must NOT include Co-Authored-By Claude lines
type: feedback
---

Never include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` in commit messages.

**Why:** User explicitly asked to remove it.

**How to apply:** All git commits in this project — no Co-Authored-By trailer, ever.
