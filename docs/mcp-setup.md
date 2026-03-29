# Supabase MCP Server — Setup & Usage Guide

## What is MCP?

**Model Context Protocol (MCP)** allows Claude Code to interact directly with external services (Supabase, GitHub, Vercel, etc.) through tool calls — no manual copy-pasting of SQL, no switching between dashboards. Claude can query your database, list tables, check migrations, and run SQL directly in conversation.

## What the Supabase MCP Enables for Contracker

| Capability | How It Helps |
|------------|-------------|
| **List tables & columns** | Verify DB schema matches `001_initial_schema.sql` |
| **Execute SQL queries** | Test queries, check data, validate constraints |
| **List extensions** | Confirm required PostgreSQL extensions are active |
| **Manage migrations** | Apply and verify schema migrations |
| **Retrieve logs** | Debug API route errors from Supabase logs |
| **Security advisor** | Check RLS policies, exposed keys, misconfigurations |
| **Performance advisor** | Identify slow queries, missing indexes |
| **Generate TypeScript types** | Keep `types/database.ts` in sync with actual schema |
| **Access API URLs/keys** | Verify environment variable values match project config |
| **Search Supabase docs** | Get documentation without leaving the conversation |

## Setup Instructions (How to Reproduce)

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- A Supabase project (free tier works)
- Browser access for OAuth login

### Step 1 — Add MCP Server to Project

Run this from the project root:

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<YOUR_PROJECT_REF>"
```

For Contracker specifically:
```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=tsewqtqlpdxmpotxbcho"
```

This creates/updates `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=tsewqtqlpdxmpotxbcho"
    }
  }
}
```

### Step 2 — Authenticate via OAuth

Start a new Claude Code session (or restart the current one):

```bash
claude
```

On first use, the Supabase MCP will open a **browser window** for OAuth authentication. Log in with your Supabase account and grant access. This is a one-time step — the token persists across sessions.

### Step 3 — Verify Connection

In Claude Code, ask:

```
List all tables in my Supabase project
```

You should see the Supabase MCP tools being called and your tables listed (profiles, suppliers, contracts, certifications, notifications).

### For CI / Non-Interactive Environments

If you need MCP access without a browser (CI, headless):

1. Generate a Personal Access Token (PAT) from your [Supabase dashboard](https://supabase.com/dashboard/account/tokens)
2. Add it to `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=tsewqtqlpdxmpotxbcho",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

3. Set `SUPABASE_ACCESS_TOKEN` in your environment (never commit the token)

### Scoping & Security Options

You can restrict MCP access via URL parameters:

| Parameter | Example | Purpose |
|-----------|---------|---------|
| `project_ref=<id>` | Already set | Limit to one project |
| `read_only=true` | Append to URL | Prevent write operations |
| `features=database,docs` | Append to URL | Limit to specific tool groups |

**Recommendation:** For development, use the default (full access). For demos or shared environments, add `read_only=true`.

## Teammate Setup

Since `.mcp.json` is committed to git, any teammate who pulls the repo gets the config automatically. They only need to:

1. `git pull` (gets `.mcp.json`)
2. Start Claude Code — browser opens for their own OAuth login
3. Done — MCP tools are available

Each teammate authenticates with their own Supabase account. No shared tokens needed.

## Demonstrated Workflow: DB Schema Verification (Issue #2)

The primary workflow we use the Supabase MCP for is verifying that the database schema matches our migration file. This replaces manually running `\dt` in psql or checking the Supabase dashboard.

### Workflow Steps

1. **List all tables** — Verify 5 tables exist (profiles, suppliers, contracts, certifications, notifications)
2. **Check table columns** — Verify each table has the correct columns, types, and constraints
3. **Verify indexes** — Confirm all 8 indexes exist, especially `idx_notifications_unique`
4. **Verify constraints** — Check `end_after_start` and `renewal_before_end` on contracts
5. **Check auth trigger** — Verify the `handle_new_user` trigger exists on `auth.users`
6. **Run a test query** — Execute a simple SELECT to confirm connectivity

### Example Session

```
User: Verify that all 5 Contracker tables exist and have the correct columns

Claude: [Calls Supabase MCP: list_tables]
         [Calls Supabase MCP: get_table_definition for each table]

Output:
  ✅ profiles — 6 columns (id, email, full_name, role, created_at, updated_at)
  ✅ suppliers — 10 columns (id, name, contact_name, ..., updated_at)
  ✅ contracts — 15 columns (id, contract_number, name, ..., updated_at)
  ✅ certifications — 9 columns (id, supplier_id, cert_type, ..., updated_at)
  ✅ notifications — 7 columns (id, user_id, contract_id, ..., created_at)

User: Check that the deduplication index exists on notifications

Claude: [Calls Supabase MCP: list_extensions / execute_sql]

Output:
  ✅ idx_notifications_unique ON notifications(contract_id, threshold_days) — UNIQUE
```

This workflow maps directly to **GitHub Issue #2** acceptance criteria and proves the database layer is correctly set up.

## Available Tool Groups

| Group | Tools | Used For |
|-------|-------|----------|
| **Database** | list_tables, get_table, execute_sql, list_extensions | Schema verification, ad-hoc queries |
| **Debugging** | get_logs, security_advisor, performance_advisor | Troubleshooting API errors, checking RLS |
| **Development** | get_project_url, get_anon_key, generate_types | Env var verification, type generation |
| **Edge Functions** | list_functions, deploy_function | Alert cron deployment (Sprint 3) |
| **Docs** | search_docs | In-conversation Supabase documentation |

## When to Use Supabase MCP vs Direct Client

| Scenario | Use MCP | Use Supabase JS Client |
|----------|---------|----------------------|
| Verify schema / indexes | ✅ | |
| Debug a failing API route | ✅ | |
| Check RLS policies | ✅ | |
| Generate TypeScript types | ✅ | |
| Application runtime queries | | ✅ |
| API route handlers | | ✅ |
| Middleware auth checks | | ✅ |

**Rule of thumb:** MCP for development/debugging tasks. Supabase JS client for application code.
