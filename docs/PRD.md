# Contracker — Product Requirements Document (PRD)

**Project:** Contracker — Contract & Supplier Management Platform
**Authors:** Raj Laskar, Vineela Goli
**Version:** 2.0
**Last Updated:** March 2026
**Status:** Ready for Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Roles](#3-user-roles)
4. [Scope — MoSCoW Reference](#4-scope--moscow-reference)
5. [Functional Requirements](#5-functional-requirements)
6. [Technical Architecture & Implementation Plan](#6-technical-architecture--implementation-plan)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)

For CI/CD, sprint plan, milestones, TDD strategy, NFRs, and open risks — see `docs/IMPLEMENTATION.md`.

---

## 1. Product Overview

### Problem Statement

Organizations managing multiple supplier contracts rely on spreadsheets, email threads, and manual reminders to track renewals, spend, and compliance. This creates three recurring failure modes:

- **Missed renewals** — contracts auto-renew on unfavorable terms because no one flagged the notice period
- **Spend blindness** — no consolidated view of what is being spent across suppliers and categories
- **Compliance gaps** — supplier certifications (ISO, NDA, insurance) expire unnoticed, creating legal and operational risk

These problems scale badly. A procurement manager juggling 30+ contracts across a spreadsheet has no reliable early-warning system.

### Solution

Contracker is a full-stack web application that gives organizations a single source of truth for their contracts and supplier relationships. Users can create and manage contracts with key dates, link them to supplier profiles, upload PDFs, and receive automatic renewal alerts via email and in-app notifications. A traffic-light risk dashboard gives managers an instant health check of their entire contract portfolio. Compliance tracking flags which suppliers have valid certifications and which are at risk.

### Core Insight

> A contract management tool only works if the dashboard is the first thing a manager checks on Monday morning. Everything in Contracker is designed to make that dashboard undeniable.

---

## 2. Goals & Success Metrics

### Product Goals

| Goal | Description |
|---|---|
| Visibility | All active contracts visible in a single dashboard with status indicators |
| Early warning | Contracts expiring within 30 days always surfaced proactively |
| Spend clarity | Total spend visible by supplier and category without manual calculation |
| Compliance confidence | Supplier certification status visible at a glance |

### Sprint-Level Success Criteria

**Sprint 1 Done When:**
- Admin can sign up, create supplier profiles, create contracts with PDF uploads
- Member can log in, view all contracts and suppliers, create/edit (but not delete) contracts
- Role-based access enforced server-side
- CI/CD pipeline live — PRs auto-deploy to Vercel preview; merge to main deploys production
- Sentry, Vercel Analytics, Better Uptime configured

**Sprint 2 Done When:**
- Contract list is searchable and filterable with pagination
- Basic dashboard shows counts by status and expiring-soon list
- Traffic-light risk indicators computed and shown on dashboard
- In-app notification bell and alerts page live
- All Sprint 1 and Sprint 2 tests passing in CI

**Sprint 3 Done When:**
- Email renewal alerts fire at 60/30/7 day thresholds with no duplicates
- Spend tracking page shows totals by supplier and category with chart
- Compliance page shows supplier certification status with traffic lights
- Member invitation flow works end-to-end
- Full app smoke-tested across browsers and deployed to production

---

## 3. User Roles

| Role | Description | Key Permissions |
|---|---|---|
| **Admin** | Org administrator. Sets up the system, manages users, owns data integrity. | Full CRUD on contracts, suppliers, certifications. Manage org members. Access all views. |
| **Member** | Procurement manager, compliance staff, or business owner. Day-to-day user. | View all contracts and suppliers. Create and edit (no delete). Cannot manage users. |
| **Super Admin** | Internal only (Raj/Vineela). No user-facing UI. | Debug access, aggregate system data. |

### Role Enforcement

- Role assigned at signup: Admin for org creator, Member for invited users
- Role stored on `profiles` table
- All API routes validate role server-side via Supabase session
- Client-side role gates are UI-only — server is the authority

---

## 4. Scope — MoSCoW Reference

| Story ID | Title | MoSCoW | Sprint |
|---|---|---|---|
| US-01 | Authentication & Role-Based Access | Must Have | Sprint 1 |
| US-02 | Supplier Profile CRUD | Must Have | Sprint 1 |
| US-03 | Contract CRUD with PDF Upload | Must Have | Sprint 1 |
| US-04 | CI/CD Pipeline + Monitoring Setup | Must Have | Sprint 1 |
| US-05 | Contract List with Search & Filter | Must Have | Sprint 2 |
| US-06 | Basic Dashboard (counts by status) | Must Have | Sprint 2 |
| US-07 | Traffic-Light Risk Indicator Dashboard | Must Have | Sprint 2 |
| US-08 | In-App Renewal Notifications | Must Have | Sprint 2 |
| US-09 | Email Renewal Alerts | Must Have | Sprint 3 |
| US-10 | Spend Tracking by Supplier & Category | Should Have | Sprint 3 |
| US-11 | Supplier Compliance & Certification Tracking | Should Have | Sprint 3 |
| US-12 | Member Invitation Flow | Should Have | Sprint 3 |
| — | Contract amendment history | Won't Have | — |
| — | KPI / SLA performance tracking | Won't Have | — |
| — | E-signature integration | Won't Have | — |
| — | Multi-org / tenant isolation | Won't Have | — |

---

## 5. Functional Requirements

### FR-01 — Authentication & Role Management

- Users sign up with email/password (Supabase Auth)
- Org creator automatically assigned Admin role on first signup
- Subsequent users assigned Member role by default; Admin can promote to Admin
- Authenticated session persists via Supabase session tokens
- Unauthenticated users cannot access any route beyond `/login` and `/signup`
- All routes protected server-side via Next.js middleware
- Admin-only routes return 403 if accessed by Member

**Acceptance Criteria (Tests):**
```
AC-01-1: GIVEN an unauthenticated user WHEN they visit /dashboard THEN they are redirected to /login
AC-01-2: GIVEN valid email/password WHEN submitted THEN a session is created and user is redirected to /dashboard
AC-01-3: GIVEN a Member role user WHEN they call DELETE /api/contracts/:id THEN response status is 403
AC-01-4: GIVEN an Admin role user WHEN they call DELETE /api/contracts/:id THEN contract is deleted and response is 200
```

---

### FR-02 — Supplier Profile Management

- Any authenticated user can view supplier list and individual profiles
- Admin and Member can create and edit suppliers
- Only Admin can delete (soft delete — linked contracts preserved)
- Supplier fields: name, contact name, contact email, contact phone, category, status (active/inactive)
- Supplier profile page shows: linked contracts list, certification status summary

**Acceptance Criteria (Tests):**
```
AC-02-1: GIVEN a logged-in Member WHEN they submit a valid new supplier form THEN a supplier record is created
AC-02-2: GIVEN a logged-in Member WHEN they call DELETE /api/suppliers/:id THEN response status is 403
AC-02-3: GIVEN a supplier with linked contracts WHEN an Admin deletes the supplier THEN status = 'inactive' and contracts remain intact
AC-02-4: GIVEN a supplier profile page WHEN rendered THEN all linked contracts are listed
```

---

### FR-03 — Contract Management (CRUD + PDF Upload)

- Admin and Member can create, view, and edit contracts
- Only Admin can delete
- Contract fields:
  - `contract_number` (unique, auto-generated if blank)
  - `name` (required)
  - `type` (service / purchase / lease / other)
  - `supplier_id` (required)
  - `category` (free text)
  - `start_date`, `end_date`, `renewal_date` (required)
  - `notice_period_days` (integer, default 30)
  - `value` (decimal)
  - `status` (active / expiring / expired) — computed, not manually set
  - `pdf_url` (Supabase Storage, optional)
  - `created_by` (user id)
- Status computed as:
  - `expired` — end_date is in the past
  - `expiring` — renewal_date is within notice_period_days from today
  - `active` — all other cases
- PDF: Supabase Storage, 10MB max, PDF only

**Acceptance Criteria (Tests):**
```
AC-03-1: GIVEN a valid contract form WHEN saved THEN a record exists in DB with all submitted fields
AC-03-2: GIVEN renewal_date is within notice_period_days of today THEN status = 'expiring'
AC-03-3: GIVEN end_date is in the past THEN status = 'expired'
AC-03-4: GIVEN a PDF under 10MB WHEN uploaded THEN pdf_url is stored and file is accessible
AC-03-5: GIVEN a non-PDF file WHEN upload attempted THEN upload is rejected with error message
AC-03-6: GIVEN a Member user WHEN they call DELETE /api/contracts/:id THEN response status is 403
```

---

### FR-04 — Contract List, Search & Filter

- All authenticated users can access the contracts list
- Columns: contract name, supplier name, type, value, renewal date, status badge (traffic light colour)
- Search: full-text on contract name and supplier name
- Filters: supplier (dropdown), status (active/expiring/expired), category (dropdown), contract type
- Sort: by renewal date (default ascending), value, name
- Pagination: 20 per page

**Acceptance Criteria (Tests):**
```
AC-04-1: GIVEN contracts exist WHEN list loads THEN all contracts render with name, supplier, status badge, renewal date, value
AC-04-2: GIVEN a search term matching a contract name WHEN submitted THEN only matching contracts are shown
AC-04-3: GIVEN filter status = 'expiring' is applied THEN only expiring contracts appear
AC-04-4: GIVEN more than 20 contracts WHEN list loads THEN only 20 shown and pagination controls are visible
```

---

### FR-05 — Basic Dashboard

- Visible to all authenticated users
- Shows: total contract count, count by status, total portfolio value, contracts expiring within 30 days

**Acceptance Criteria (Tests):**
```
AC-05-1: GIVEN contracts exist WHEN dashboard loads THEN correct count per status is displayed
AC-05-2: GIVEN contracts with renewal_date within 30 days WHEN dashboard loads THEN those contracts appear in expiring-soon list
AC-05-3: GIVEN contracts with known values WHEN dashboard loads THEN total portfolio value equals sum of all active contract values
```

---

### FR-06 — Traffic-Light Risk Indicator Dashboard

- Traffic light per contract:
  - 🟢 Green — renewal_date > 60 days away
  - 🟡 Amber — renewal_date within 60 days
  - 🔴 Red — renewal_date within notice_period_days OR expired
- Portfolio summary bar: count of green / amber / red
- Contracts sorted red → amber → green
- Supplier risk roll-up: supplier flagged amber/red if any contract is amber/red

**Acceptance Criteria (Tests):**
```
AC-06-1: GIVEN renewal_date > 60 days from today THEN risk colour = 'green'
AC-06-2: GIVEN renewal_date within 60 days but outside notice_period_days THEN risk colour = 'amber'
AC-06-3: GIVEN renewal_date within notice_period_days THEN risk colour = 'red'
AC-06-4: GIVEN a supplier with at least one red contract WHEN supplier list renders THEN supplier shows red indicator
AC-06-5: GIVEN dashboard loads THEN contracts are ordered red → amber → green
```

---

### FR-07 — In-App Renewal Notifications

- Alert triggers when renewal_date enters notice_period_days window
- Notification bell in nav shows unread count
- Notification list: contract name, renewal date, days remaining
- Users can mark notifications as read; read notifications archived not deleted
- Thresholds: 60 days, 30 days, 7 days before renewal_date
- No duplicate notifications per contract per threshold

**Acceptance Criteria (Tests):**
```
AC-07-1: GIVEN renewal_date is exactly 60 days away WHEN alert cron runs THEN in-app notification is created for contract owner
AC-07-2: GIVEN same contract WHEN cron runs next day THEN no duplicate 60-day notification is created
AC-07-3: GIVEN unread notification exists WHEN user views notifications THEN it shows contract name and days remaining
AC-07-4: GIVEN unread notification WHEN user marks as read THEN unread count decrements
```

---

### FR-08 — Email Renewal Alerts

- Email sent to contract's `created_by` user at each threshold (60, 30, 7 days)
- Subject: "Renewal alert: [contract name] renews in X days"
- Sent once per contract per threshold — no duplicates
- Implementation: Supabase Edge Function cron (every 24h) + Resend for email delivery

**Acceptance Criteria (Tests):**
```
AC-08-1: GIVEN contract at 30-day threshold WHEN cron runs THEN email sent to contract owner's email address
AC-08-2: GIVEN same contract at same threshold WHEN cron runs again THEN no second email sent
AC-08-3: GIVEN contract owner's email changes THEN next alert uses updated email
```

---

### FR-09 — Spend Tracking

- Spend summary page accessible to all authenticated users
- Total spend by supplier (sorted desc) and by category (sorted desc)
- Date filter: all time (default), current year, custom range
- Spend = sum of `value` across non-expired contracts matching filter
- Bar chart (Recharts) for top 10 suppliers by spend

**Acceptance Criteria (Tests):**
```
AC-09-1: GIVEN contracts with known values across suppliers WHEN spend page loads THEN each supplier shows correct summed value
AC-09-2: GIVEN a category filter applied THEN only contracts in that category are included in totals
AC-09-3: GIVEN current year filter applied THEN only contracts with start_date in current year are included
```

---

### FR-10 — Supplier Compliance & Certification Tracking

- Each supplier can have multiple certifications: ISO, NDA, Insurance, Other
- Certification fields: type, issued_date, expiry_date, document_url (optional PDF)
- Certification status (computed): valid / expiring (within 30 days) / expired
- Compliance page: all suppliers with certification status summary and traffic lights
- Suppliers missing a required certification type are flagged

**Acceptance Criteria (Tests):**
```
AC-10-1: GIVEN expiry_date > 30 days from today THEN certification status = 'valid'
AC-10-2: GIVEN expiry_date within 30 days THEN certification status = 'expiring'
AC-10-3: GIVEN expiry_date in the past THEN certification status = 'expired'
AC-10-4: GIVEN supplier with at least one expired certification WHEN compliance page loads THEN supplier flagged red
AC-10-5: GIVEN new certification created for supplier THEN it appears on supplier profile and compliance page
```

---

### FR-11 — Member Invitation Flow

- Admin can invite user by email from team settings page
- Invitation sends Supabase Auth invite email
- Invited user clicks link, sets password, assigned Member role automatically
- Admin can view pending invitations and revoke
- Admin can promote Member to Admin or demote Admin to Member

**Acceptance Criteria (Tests):**
```
AC-11-1: GIVEN Admin submits email invitation THEN pending invite record created and email dispatched
AC-11-2: GIVEN invited user clicks link and sets password THEN profile created with role = 'member'
AC-11-3: GIVEN Admin promotes Member to Admin THEN profiles table updated to role = 'admin'
```

---

## 6. Technical Architecture & Implementation Plan

### 6.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                       │
│              Next.js React App (Vercel)                 │
│     App Router + React Components + Server Components   │
│     Tailwind CSS + shadcn/ui + 21st.dev Magic           │
│     Framer Motion animations                            │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
                        │ Next.js API Routes (/api/*)
┌───────────────────────▼─────────────────────────────────┐
│                 NEXT.JS SERVER LAYER                    │
│   API Routes — business logic & DB queries              │
│   Middleware — auth + role gate on all routes           │
└───────────────────────┬─────────────────────────────────┘
                        │ Supabase JS Client
┌───────────────────────▼─────────────────────────────────┐
│                      SUPABASE                           │
│   PostgreSQL — primary data store                       │
│   Row Level Security — secondary safety net             │
│   Supabase Auth — email/password + invite flow          │
│   Supabase Storage — PDF uploads (private bucket)       │
│   Realtime — in-app notification delivery               │
│   Edge Functions — renewal alert cron (daily)           │
└─────────────────────────────────────────────────────────┘

Observability:
  Sentry          — error tracking (frontend + API routes)
  Vercel Analytics — APM + Core Web Vitals
  Better Uptime   — uptime monitoring + alerting
```

### 6.2 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, file-based routing, API routes, Vercel-native |
| UI Library | React 18 | Component model, hooks, server components |
| Styling | Tailwind CSS v3 | Utility-first, consistent design tokens |
| Component Library | shadcn/ui | Accessible primitives built on Radix UI |
| UI Components | 21st.dev Magic (MCP) | Production-grade pre-built components via Claude Code MCP |
| Animation | Framer Motion | Page transitions, dashboard stagger animations, notification slide-ins |
| Charts | Recharts | Lightweight React-native charts for spend tracking |
| Database | Supabase (PostgreSQL) | Relational schema, RLS, built-in Auth |
| Authentication | Supabase Auth | Email/password, invite flow, session + JWT management |
| File Storage | Supabase Storage | Contract and certification PDFs (private bucket, signed URLs) |
| Email Delivery | Resend | Transactional emails (renewal alerts, invites) |
| CI/CD | GitHub Actions + Vercel | Automated test/lint on PRs, preview deployments, production on merge |
| Error Tracking | Sentry | Frontend + server-side error capture and alerting |
| APM | Vercel Analytics | Core Web Vitals, route performance, usage |
| Uptime | Better Uptime | HTTP uptime checks every 3 minutes + incident alerting |
| Testing | Vitest + React Testing Library | Unit + integration tests (TDD) |
| E2E Testing | Playwright | End-to-end acceptance tests run in CI |
| Secrets | Vercel Environment Variables + GitHub Secrets | No secrets in source code |

### 6.3 Project Directory Structure

```
contracker/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── contracts/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── suppliers/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── compliance/page.tsx
│   │   ├── spend/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── team/page.tsx         # Admin only
│   ├── api/
│   │   ├── contracts/route.ts
│   │   ├── contracts/[id]/route.ts
│   │   ├── suppliers/route.ts
│   │   ├── suppliers/[id]/route.ts
│   │   ├── certifications/route.ts
│   │   ├── certifications/[id]/route.ts
│   │   ├── notifications/route.ts
│   │   ├── notifications/[id]/route.ts
│   │   ├── spend/route.ts
│   │   ├── dashboard/route.ts
│   │   └── team/route.ts
│   ├── layout.tsx
│   └── middleware.ts
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── contracts/
│   ├── suppliers/
│   ├── dashboard/
│   ├── compliance/
│   ├── spend/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── risk.ts                       # Pure functions — primary TDD target
│   ├── alerts.ts                     # Alert threshold logic — primary TDD target
│   └── utils.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── types/
│   └── database.ts
├── __tests__/
│   ├── lib/
│   │   ├── risk.test.ts
│   │   └── alerts.test.ts
│   └── api/
│       ├── contracts.test.ts
│       └── suppliers.test.ts
├── e2e/
│   └── contracts.spec.ts
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + test on every PR
│       └── deploy.yml                # Production deploy on merge to main
├── docs/
│   └── PRD.md                        # This file — @import in CLAUDE.md
├── .env.local
└── next.config.ts
```

### 6.4 UI/UX Approach

Contracker uses a **refined, data-dense professional aesthetic** suited to procurement and operations users:

- **21st.dev Magic MCP** — used to scaffold complex UI components (data tables, form dialogs, notification panels) during Claude Code sessions
- **Framer Motion** — dashboard stagger reveals on load, traffic-light colour transitions, page transitions, notification slide-ins
- **Design system:** Dark sidebar navigation, clean white content area, consistent status colours (`#16a34a` green, `#d97706` amber, `#dc2626` red) across all traffic-light indicators
- **Typography:** Display headings in DM Sans, body in Geist

---

## 7. Database Schema

### 7.1 SQL Schema

```sql
-- ─────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('admin', 'member', 'super_admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SUPPLIERS
-- ─────────────────────────────────────────
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  category        TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive')),
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CONTRACTS
-- ─────────────────────────────────────────
CREATE TABLE contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number     TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL
                        CHECK (type IN ('service', 'purchase', 'lease', 'other')),
  supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  category            TEXT,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  renewal_date        DATE NOT NULL,
  notice_period_days  INTEGER NOT NULL DEFAULT 30,
  value               NUMERIC(15, 2),
  pdf_url             TEXT,
  created_by          UUID NOT NULL REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_date >= start_date),
  CONSTRAINT renewal_before_end CHECK (renewal_date <= end_date)
);

-- ─────────────────────────────────────────
-- CERTIFICATIONS (per supplier)
-- ─────────────────────────────────────────
CREATE TABLE certifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  cert_type       TEXT NOT NULL
                    CHECK (cert_type IN ('ISO', 'NDA', 'insurance', 'other')),
  issued_date     DATE,
  expiry_date     DATE NOT NULL,
  document_url    TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS (in-app renewal alerts)
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  threshold_days  INTEGER NOT NULL CHECK (threshold_days IN (60, 30, 7)),
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate alerts per contract per threshold
CREATE UNIQUE INDEX idx_notifications_unique
  ON notifications(contract_id, threshold_days);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_contracts_supplier   ON contracts(supplier_id);
CREATE INDEX idx_contracts_renewal    ON contracts(renewal_date ASC);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_certifications_supplier ON certifications(supplier_id);
CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
```

### 7.2 Computed Status Logic (Pure Functions — TDD Targets)

Status is **not stored** in the database. Computed in `lib/risk.ts`:

```typescript
export function getContractStatus(
  endDate: Date,
  renewalDate: Date,
  noticePeriodDays: number,
  today: Date = new Date()
): 'active' | 'expiring' | 'expired' {
  if (endDate < today) return 'expired';
  const daysToRenewal = diffInDays(renewalDate, today);
  if (daysToRenewal <= noticePeriodDays) return 'expiring';
  return 'active';
}

export function getRiskColour(
  renewalDate: Date,
  noticePeriodDays: number,
  today: Date = new Date()
): 'green' | 'amber' | 'red' {
  const daysToRenewal = diffInDays(renewalDate, today);
  if (daysToRenewal <= noticePeriodDays) return 'red';
  if (daysToRenewal <= 60) return 'amber';
  return 'green';
}
```

### 7.3 Entity Relationship Summary

```
profiles (1) ──────── (N) contracts        [created_by]
profiles (1) ──────── (N) suppliers        [created_by]
profiles (1) ──────── (N) notifications    [user_id]
suppliers (1) ─────── (N) contracts        [supplier_id]
suppliers (1) ─────── (N) certifications   [supplier_id]
contracts (1) ─────── (N) notifications    [contract_id]
```

---

## 8. API Design

All routes under `/app/api/`. All routes require valid Supabase session. Role checks server-side.

### Contract Routes

| Method | Route | Description | Min Role |
|---|---|---|---|
| GET | `/api/contracts` | List all contracts (filters + pagination) | Member |
| POST | `/api/contracts` | Create contract | Member |
| GET | `/api/contracts/[id]` | Get single contract | Member |
| PUT | `/api/contracts/[id]` | Update contract | Member |
| DELETE | `/api/contracts/[id]` | Delete contract | **Admin** |

### Supplier Routes

| Method | Route | Description | Min Role |
|---|---|---|---|
| GET | `/api/suppliers` | List suppliers | Member |
| POST | `/api/suppliers` | Create supplier | Member |
| GET | `/api/suppliers/[id]` | Get supplier + contracts + certs | Member |
| PUT | `/api/suppliers/[id]` | Update supplier | Member |
| DELETE | `/api/suppliers/[id]` | Soft-delete (set inactive) | **Admin** |

### Certification Routes

| Method | Route | Description | Min Role |
|---|---|---|---|
| GET | `/api/certifications?supplier_id=` | List certifications | Member |
| POST | `/api/certifications` | Create certification | Member |
| PUT | `/api/certifications/[id]` | Update certification | Member |
| DELETE | `/api/certifications/[id]` | Delete certification | **Admin** |

### Notification Routes

| Method | Route | Description | Min Role |
|---|---|---|---|
| GET | `/api/notifications` | List unread notifications | Member |
| PUT | `/api/notifications/[id]` | Mark as read | Member |

### Dashboard & Spend Routes

| Method | Route | Description | Min Role |
|---|---|---|---|
| GET | `/api/dashboard` | Counts by status, expiring-soon list | Member |
| GET | `/api/spend` | Totals by supplier and category | Member |

### Team Routes

| Method | Route | Description | Min Role |
|---|---|---|---|
| GET | `/api/team` | List org members | **Admin** |
| POST | `/api/team/invite` | Send invite email | **Admin** |
| PUT | `/api/team/[id]` | Update member role | **Admin** |
| DELETE | `/api/team/[id]` | Remove member | **Admin** |

### Response Format

```typescript
{ data: T, error: null }              // Success
{ data: null, error: { message: string, code: string } }  // Error
```

---
