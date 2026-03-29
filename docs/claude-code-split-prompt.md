# Claude Code Prompt: Split PRD into Two Files

Split `docs/Contracker_PRD.md` into two files to reduce context window impact (currently 51k chars, limit is 40k).

---

## File 1: `docs/PRD.md` (~20-25k chars)

Keep sections 1–8 exactly as they are:

- Product Overview
- Goals & Success Metrics
- User Roles
- Scope — MoSCoW Reference
- Functional Requirements (FR-01 through FR-11 with all acceptance criteria)
- Technical Architecture & Implementation Plan (architecture diagram, tech stack, directory structure, UI/UX approach)
- Database Schema (SQL, computed status logic, ER summary)
- API Design (all route tables + response format)

---

## File 2: `docs/IMPLEMENTATION.md` (~20-25k chars)

Move sections 9–14 here:

- CI/CD, Monitoring & Security
- Sprint Plan
- Sprint Milestones
- GitHub Issues & TDD Strategy
- Non-Functional Requirements
- Open Risks

Add a one-line header to `IMPLEMENTATION.md`:

> Companion to `docs/PRD.md` — covers CI/CD, sprints, milestones, TDD strategy, and operational requirements.

---

## Update `CLAUDE.md`

Replace the existing `@import` for the PRD with:

```
@import ./docs/PRD.md
# For sprint plan, milestones, CI/CD, TDD strategy, and security details, see ./docs/IMPLEMENTATION.md
```

---

## Rules

- Do NOT rewrite, summarize, or trim any content. This is a split, not an edit.
- Preserve all markdown formatting, tables, code blocks, and acceptance criteria verbatim.
- Delete the original `docs/Contracker_PRD.md` after both new files are confirmed.

---

## If PRD.md Still Exceeds 40k

If `docs/PRD.md` still lands over the threshold after the split:

1. Move the full SQL schema (Section 7.1) into `docs/SCHEMA.sql` and replace it in `PRD.md` with: `Full SQL schema in docs/SCHEMA.sql`
2. Move the directory structure listing (Section 6.3) into a comment block in `CLAUDE.md` directly, since that's where it's most useful
