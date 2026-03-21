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
9. [CI/CD, Monitoring & Security](#9-cicd-monitoring--security)
10. [Sprint Plan](#10-sprint-plan)
11. [Sprint Milestones](#11-sprint-milestones)
12. [GitHub Issues & TDD Strategy](#12-github-issues--tdd-strategy)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Open Risks](#14-open-risks)

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

## 9. CI/CD, Monitoring & Security

### 9.1 Branch Strategy & Naming Convention

```
main          → production (auto-deploys to Vercel production)
staging       → staging/preview environment
feature/*     → feature branches (PR into main)
fix/*         → bug fixes
chore/*       → non-functional changes (deps, config)
```

**Branch naming format:**
```
feature/[issue-number]-short-description
fix/[issue-number]-short-description

Examples:
  feature/42-contract-crud
  feature/17-traffic-light-dashboard
  fix/53-renewal-date-off-by-one
```

All branch names use lowercase kebab-case. Issue number required. No spaces.

### 9.2 CI/CD Pipeline (GitHub Actions + Vercel)

#### PR Workflow (`ci.yml`) — runs on every pull request

```yaml
jobs:
  lint:       # ESLint + TypeScript type check
  test:       # Vitest unit + integration tests
  e2e:        # Playwright end-to-end tests
  build:      # next build (catches build-time errors)
  perf-gate:  # Lighthouse CI — fails PR if LCP > 2.5s or CLS > 0.1
```

**Performance gate:** PRs that degrade Core Web Vitals (LCP > 2.5s) are blocked from merging. This is enforced via `@lhci/cli` in the CI pipeline.

#### Deploy Workflow (`deploy.yml`)

| Event | Target | Behaviour |
|---|---|---|
| PR opened/updated | Vercel Preview URL | Auto-deployed; unique URL per PR |
| Merge to `main` | Vercel Production | Auto-deploys; Vercel handles blue-green internally (zero downtime) |
| Rollback needed | Vercel Dashboard | One-click rollback to previous deployment |

**Blue-green / canary strategy:** Vercel's deployment model provides zero-downtime production deploys. Each deploy is immutable and instantly promotable/rollbackable. For canary testing, Vercel's deployment protection rules allow traffic splitting between the new deploy (preview) and current production before full promotion.

#### CI Status Checks Required to Merge

- `lint` — must pass
- `test` — must pass (100% of existing tests)
- `build` — must pass
- `perf-gate` — LCP ≤ 2.5s, CLS ≤ 0.1 (warning only until Sprint 2, blocking from Sprint 3)

### 9.3 Monitoring Stack

| Tool | Purpose | Config |
|---|---|---|
| **Sentry** | Error tracking — captures unhandled exceptions in both client and API routes. Alerts on new issues and error spikes. | Installed via `@sentry/nextjs`. DSN stored in Vercel env vars. Slack alert on new P1 issues. |
| **Vercel Analytics** | APM — tracks route performance, Core Web Vitals (LCP, FID, CLS), and page-level traffic. | Enabled in `next.config.ts`. No additional install needed. |
| **Better Uptime** | Uptime monitoring — HTTP check on production URL every 3 minutes. Alerts via email if downtime > 1 minute. | Monitor: `https://contracker.vercel.app`. Alert contacts: Raj + Vineela email. |

**Alerting thresholds:**
- Sentry: alert on any new issue with `level: error` or `level: fatal`
- Better Uptime: alert if uptime check fails for 2 consecutive intervals (6 minutes)
- Vercel Analytics: review weekly; no automated alerting (observational only for MVP)

### 9.4 Security

#### Secrets Management
- All secrets stored in **Vercel Environment Variables** (production) and **GitHub Secrets** (CI/CD)
- No secrets in source code, `.env` files not committed (`.env.local` in `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never exposed to client
- `RESEND_API_KEY` — server-side only
- `SENTRY_DSN` — safe to expose to client (public by design)

#### OWASP Top 10 — Addressed Items

| OWASP Risk | Mitigation in Contracker |
|---|---|
| A01 Broken Access Control | Role checks enforced in every API route handler server-side. Supabase RLS as secondary net. Member cannot reach Admin endpoints regardless of client manipulation. |
| A02 Cryptographic Failures | HTTPS enforced by Vercel. Supabase Storage uses private buckets + signed URLs (15-min expiry). No sensitive data in localStorage. |
| A03 Injection | Supabase JS client uses parameterised queries — no raw SQL string interpolation. All user inputs validated with Zod before DB operations. |
| A04 Insecure Design | Auth state never trusted client-side alone. Session validated server-side on every API call via `supabase.auth.getUser()`. |
| A05 Security Misconfiguration | Vercel preview URLs protected by Vercel deployment protection. No debug endpoints in production. Error messages in API responses never expose stack traces. |
| A07 Identification & Auth Failures | Supabase Auth handles session expiry, token refresh, and brute-force protection. No custom auth logic. |
| A09 Security Logging & Monitoring | Sentry captures all server-side errors including auth failures. Supabase provides auth audit logs. |

#### Input Validation
- All API route inputs validated with **Zod** schemas before any DB operation
- File uploads: type check (PDF only) and size check (10MB max) before Supabase Storage call
- Pagination params: clamped server-side (page ≥ 1, limit ≤ 100)

---

## 10. Sprint Plan

### Sprint 1 — Foundation (Raj)
**Duration:** March 24 — April 3  
**Owner:** Raj  
**Goal:** Auth, supplier CRUD, contract CRUD with PDF upload, CI/CD pipeline live, monitoring configured.

#### Screens in Sprint 1

| Screen | Route |
|---|---|
| Login | `/login` |
| Sign Up | `/signup` |
| Supplier List | `/suppliers` |
| Supplier Detail | `/suppliers/[id]` |
| Supplier New | `/suppliers/new` |
| Contract New | `/contracts/new` |
| Contract Detail | `/contracts/[id]` |
| Contract Edit | `/contracts/[id]/edit` |

#### Sprint 1 At-Risk Items
1. PDF upload → defer to Sprint 2, ship text-only contract
2. Google OAuth → email/password only is sufficient for MVP

---

### Sprint 2 — Contract Visibility (Raj → Vineela handoff)
**Duration:** April 4 — April 12  
**Raj owns:** Contract list/search/filter, basic dashboard, `lib/risk.ts` with tests  
**Vineela owns:** Traffic-light dashboard UI, in-app notifications

**Handoff condition:** Raj merges `feature/[n]-risk-lib` with all `lib/risk.ts` tests passing. Vineela picks up the UI layer. No API work needed from Vineela in Sprint 2 — all endpoints already exist.

#### Screens added in Sprint 2

| Screen | Route | Owner |
|---|---|---|
| Contract List | `/contracts` | Raj |
| Dashboard (basic) | `/dashboard` | Raj |
| Dashboard (traffic-light) | `/dashboard` | Vineela |
| Notifications | `/notifications` | Vineela |

#### Sprint 2 At-Risk Items
1. Pagination → cap list at 100
2. Supplier filter dropdown → ship status filter only

---

### Sprint 3 — Alerts, Spend & Compliance (Vineela)
**Duration:** April 13 — April 17  
**Owner:** Vineela  
**Goal:** Email alerts, spend tracking, compliance tracking, member invitation, final QA and deploy.

#### Screens added in Sprint 3

| Screen | Route |
|---|---|
| Spend | `/spend` |
| Compliance | `/compliance` |
| Certification Add | `/suppliers/[id]/certifications/new` |
| Team Settings | `/settings/team` |

#### Sprint 3 At-Risk Items
1. Email alerts → in-app only if Resend setup delays
2. Spend chart → table only (no Recharts) to save time
3. Member invitation UI → manual Supabase invite as fallback

---

## 11. Sprint Milestones

### Sprint 1 Milestones (Raj)

#### M1.0 — Scaffolding, CI/CD & Monitoring
**Due: March 24 (Day 1)**

| Task | Done When |
|---|---|
| Next.js 14 + Tailwind + shadcn/ui + Framer Motion installed | `npm run dev` starts cleanly |
| Supabase project created, env vars in Vercel | Client connects from app |
| Full DB schema migrated | All tables exist |
| GitHub repo created with branch protection on `main` | PRs required to merge |
| `.github/workflows/ci.yml` — lint + test + build on PR | CI runs and passes on empty test suite |
| `.github/workflows/deploy.yml` — Vercel preview on PR, production on merge | Preview URL generated on first PR |
| Sentry installed (`@sentry/nextjs`) | Test error captured in Sentry dashboard |
| Better Uptime monitor created for production URL | Monitor showing "pending" until first deploy |
| `CLAUDE.md` written with `@import ./docs/PRD.md` | Claude Code reads project context |

---

#### M1.1 — Authentication & Role Gate
**Due: March 26**

| Task | Done When |
|---|---|
| Login page (email/password) | User can sign in; session persists on refresh |
| Signup page | New user created; profiles row with role='admin' |
| Next.js middleware auth gate | Unauthenticated users redirected to /login |
| `lib/auth.ts` — `requireAdmin()` server-side helper | Returns 403 for member session |
| Tests written first (red commit) | `__tests__/api/auth.test.ts` fails before implementation |
| Tests passing (green commit) | All AC-01-x pass |

---

#### M1.2 — Supplier CRUD
**Due: March 28**

| Task | Done When |
|---|---|
| Supplier list, create, detail, edit pages | All supplier operations functional |
| Admin-only soft delete | 403 for Member; status set to 'inactive' for Admin |
| Tests: red commit first | `__tests__/api/suppliers.test.ts` fails before implementation |
| Tests: green + refactor commits | All AC-02-x pass |

---

#### M1.3 — Contract CRUD + PDF Upload
**Due: April 1**

| Task | Done When |
|---|---|
| Contract create form (all required fields) | Contract saved with auto-generated contract_number |
| PDF upload to Supabase Storage (private bucket, signed URL) | pdf_url stored; file accessible via signed URL |
| Contract detail and edit pages | All fields visible and editable |
| Admin-only delete | 403 for Member; Admin deletes successfully |
| Status computation in API response (uses `lib/risk.ts`) | active/expiring/expired returned correctly |
| Zod validation on create/update inputs | Invalid inputs rejected with structured error |
| Tests: red → green → refactor | All AC-03-x pass |

---

#### M1.4 — Sprint 1 Integration, QA & Deploy
**Due: April 3**

| Task | Done When |
|---|---|
| Happy path: Signup → Create Supplier → Create Contract → View Contract | Zero errors |
| Role check confirmed: Member blocked from all delete endpoints | Confirmed by automated tests |
| CI passing on all PRs | No failing checks on main |
| Production deploy live | URL accessible; Sentry active; Better Uptime green |

**Sprint 1 exit check:**
- [ ] Auth works, sessions persist on refresh
- [ ] Supplier CRUD works for both roles (delete blocked for Member)
- [ ] Contract CRUD + PDF upload works
- [ ] Status computed correctly (active/expiring/expired)
- [ ] CI pipeline runs on every PR
- [ ] Production URL live with Sentry + Better Uptime active

---

### Sprint 2 Milestones

#### M2.0 — Contract List, Search & Filter
**Due: April 5**  
**Owner: Raj**

| Task | Done When |
|---|---|
| Contract list page with all columns | All contracts rendered |
| Search by name and supplier | Matching contracts only |
| Filter by status, supplier, category | Filter reduces results correctly |
| Sort by renewal date (default) | Soonest renewals first |
| Pagination (20 per page) | Controls visible when > 20 contracts |
| Tests: AC-04-x | All pass |

---

#### M2.1 — Basic Dashboard + Risk Logic
**Due: April 7**  
**Owner: Raj**

| Task | Done When |
|---|---|
| `GET /api/dashboard` — counts by status, expiring-soon list, total value | Correct values confirmed by test |
| Basic dashboard page renders counts | Active / expiring / expired + total value visible |
| `lib/risk.ts` — `getContractStatus()` and `getRiskColour()` pure functions | Tests written first; all AC-03-2, AC-03-3, AC-06-1 through AC-06-3 pass |
| **Handoff commit merged** | `feature/[n]-risk-lib` merged to main; Vineela can now build on it |

---

#### M2.2 — Traffic-Light Dashboard UI
**Due: April 9**  
**Owner: Vineela**

| Task | Done When |
|---|---|
| Dashboard extended with risk colour per contract | Risk field consumed from API |
| Traffic-light badges rendered (green/amber/red) | Visual indicators visible per contract |
| Portfolio summary bar (count per colour) | Correct counts displayed |
| Contracts sorted red → amber → green | Sort confirmed in test |
| Supplier risk roll-up | Suppliers flagged if any contract is amber/red |
| Tests: AC-06-4, AC-06-5 | Pass |

---

#### M2.3 — In-App Notifications
**Due: April 11**  
**Owner: Vineela**

| Task | Done When |
|---|---|
| `lib/alerts.ts` — `shouldSendAlert()` logic | Tests written first; all AC-07-1, AC-07-2 pass |
| Supabase Edge Function cron (daily) | Inserts notification rows at correct thresholds |
| Unique index prevents duplicates | Second cron run creates no new rows |
| `GET /api/notifications` — returns unread only | Confirmed by test |
| `PUT /api/notifications/[id]` — marks as read | is_read flipped; unread count decrements |
| Notification bell in nav with unread count | Badge visible |
| Notifications page | List with contract name and days remaining |
| Tests: AC-07-3, AC-07-4 | Pass |

---

#### M2.4 — Sprint 2 Integration & QA
**Due: April 12**  
**Owner: Raj + Vineela**

| Task | Done When |
|---|---|
| Happy path: Login → Contracts List → Dashboard → Notifications | Zero errors |
| Traffic-light colours verified end-to-end | Manual + automated check |
| All Sprint 2 tests passing in CI | No failing checks |

---

### Sprint 3 Milestones (Vineela)

#### M3.0 — Email Renewal Alerts
**Due: April 13**

| Task | Done When |
|---|---|
| Resend configured, env vars set | Test email delivers |
| Edge Function sends email at each threshold | Email received for 60/30/7 day thresholds |
| No duplicate emails (unique index enforces idempotency) | Second cron run sends no second email |
| Tests: AC-08-x | Pass |

---

#### M3.1 — Spend Tracking
**Due: April 14**

| Task | Done When |
|---|---|
| `GET /api/spend` — totals by supplier and category | Correct sums confirmed by test |
| Spend page: supplier breakdown table | All suppliers with totals |
| Category breakdown table | All categories with totals |
| Bar chart (Recharts) — top 10 suppliers | Chart renders with correct data |
| Year filter | Totals correctly scoped |
| Tests: AC-09-x | Pass |

---

#### M3.2 — Compliance & Certification Tracking
**Due: April 15**

| Task | Done When |
|---|---|
| Certification CRUD on supplier profile | Create/edit/delete works |
| Certification status computed (valid/expiring/expired) | Tests pass for all AC-10-x |
| Compliance page — all suppliers with cert summary | Red-flagged suppliers visible |
| Certification document upload | document_url stored |
| Tests: AC-10-x | Pass |

---

#### M3.3 — Member Invitation
**Due: April 16**

| Task | Done When |
|---|---|
| Team settings page (Admin only — 403 for Member) | Member list visible to Admin only |
| `POST /api/team/invite` — Supabase Auth invite | Invite email delivered |
| Invited user completes signup with role='member' | Profile created correctly |
| Admin promote/demote | Role updated in profiles table |
| Tests: AC-11-x | Pass |

---

#### M3.4 — Final QA, Security Audit & Deploy
**Due: April 17**

| Task | Done When |
|---|---|
| Full happy path: Login → Contracts → Dashboard → Notifications → Spend → Compliance | Zero errors |
| Role audit: Member blocked from all Admin endpoints via automated tests | Confirmed |
| OWASP checklist reviewed against codebase | All A01–A09 items verified |
| Lighthouse CI perf gate set to blocking (LCP ≤ 2.5s) | CI blocks failing PRs |
| All Sprint 3 tests passing | No failing tests |
| Sentry and Better Uptime confirmed active on production | Dashboards show green |
| Final production deploy | Production URL live |
| Smoke test: Chrome, Firefox, Safari | No console errors on any screen |

**Sprint 3 exit check (all must pass):**
- [ ] Email alerts delivered at 60/30/7 day thresholds
- [ ] No duplicate in-app or email notifications
- [ ] Spend page shows correct totals and chart
- [ ] Compliance page flags expired/expiring certifications with traffic lights
- [ ] Member invitation flow works end-to-end
- [ ] All role guards confirmed via automated tests
- [ ] CI pipeline: lint + test + build + perf gate all passing
- [ ] Sentry active and capturing errors
- [ ] Better Uptime monitor green
- [ ] Production URL live and smoke-tested across browsers

---

### Milestone Summary Table

| Milestone | Description | Owner | Due Date | Sprint |
|---|---|---|---|---|
| M1.0 | Scaffolding, CI/CD, monitoring | Raj | Mar 24 | 1 |
| M1.1 | Auth + role gate | Raj | Mar 26 | 1 |
| M1.2 | Supplier CRUD | Raj | Mar 28 | 1 |
| M1.3 | Contract CRUD + PDF upload | Raj | Apr 1 | 1 |
| M1.4 | Sprint 1 QA + deploy | Raj | Apr 3 | 1 |
| M2.0 | Contract list, search, filter | Raj | Apr 5 | 2 |
| M2.1 | Basic dashboard + risk lib | Raj | Apr 7 | 2 |
| M2.2 | Traffic-light dashboard UI | Vineela | Apr 9 | 2 |
| M2.3 | In-app notifications | Vineela | Apr 11 | 2 |
| M2.4 | Sprint 2 QA | Both | Apr 12 | 2 |
| M3.0 | Email renewal alerts | Vineela | Apr 13 | 3 |
| M3.1 | Spend tracking | Vineela | Apr 14 | 3 |
| M3.2 | Compliance + certifications | Vineela | Apr 15 | 3 |
| M3.3 | Member invitation | Vineela | Apr 16 | 3 |
| M3.4 | Final QA + security audit + deploy | Both | Apr 17 | 3 |

---

### Cut Priority (if behind schedule)

| Cut Order | What to Cut | Impact | When to Cut |
|---|---|---|---|
| 1 | PDF upload → text fields only | Low | If M1.3 runs > 4 hrs over |
| 2 | Pagination → cap list at 100 | Low | If M2.0 runs over |
| 3 | Email alerts → in-app only | Medium | If M3.0 runs > 4 hrs over |
| 4 | Spend chart → table only | Low | If M3.1 runs over |
| 5 | Cert document upload → metadata only | Low | If M3.2 runs over |
| 6 | Member invitation UI → manual Supabase invite | Medium | If Sprint 3 Day 3 has backlog |

---

## 12. GitHub Issues & TDD Strategy

### GitHub Project Setup

- **Repo:** `contracker`
- **GitHub Projects board:** Three sprints, columns: `Backlog → In Progress → PR Open → Done`
- **Labels:** `sprint-1`, `sprint-2`, `sprint-3`, `tdd`, `enhancement`, `bug`, `admin-only`, `security`
- **Milestones:** Sprint 1 (Apr 3), Sprint 2 (Apr 12), Sprint 3 (Apr 17)

### Issue Structure

Each Functional Requirement maps to one GitHub Issue. Acceptance criteria in each issue are written as **failing test descriptions** before any implementation begins.

**Example Issue: #14 — Risk Colour Computation**

```
Title: [TDD] Implement getRiskColour() in lib/risk.ts

Labels: sprint-2, tdd
Milestone: Sprint 2
Branch: feature/14-risk-colour-logic

Description:
Pure function that returns green/amber/red based on renewal_date
and notice_period_days. No DB dependency.

Acceptance Criteria (write tests FIRST — commit as red):
  AC-06-1: renewal_date > 60 days → 'green'
  AC-06-2: renewal_date within 60 days, outside notice_period → 'amber'
  AC-06-3: renewal_date within notice_period_days → 'red'
  Edge case: renewal_date = exactly today → 'red'
  Edge case: today injected as param → deterministic in tests

TDD Commits Required:
  test: add failing tests for getRiskColour (red)
  feat: implement getRiskColour to pass tests (green)
  refactor: extract diffInDays helper, clean up edge cases
```

### TDD Git Commit Pattern

```
test: add failing tests for [feature]      ← RED — tests fail, no implementation
feat: implement [feature] to pass tests    ← GREEN — all tests pass
refactor: [description of cleanup]         ← REFACTOR — tests still pass, code cleaner
```

Claude Code is instructed in `CLAUDE.md` to never combine test + implementation into a single commit.

### Primary TDD Targets

| File | Function | Why |
|---|---|---|
| `lib/risk.ts` | `getContractStatus()` | Wrong = broken dashboard |
| `lib/risk.ts` | `getRiskColour()` | Wrong = wrong traffic lights |
| `lib/alerts.ts` | `shouldSendAlert()` | Idempotency critical — duplicates are P0 bugs |
| `api/contracts/route.ts` | `POST` handler | Role check + Zod validation |
| `api/contracts/[id]/route.ts` | `DELETE` handler | Admin-only enforcement |

---

## 13. Non-Functional Requirements

### Performance
- LCP: < 2.5 seconds on standard broadband (enforced via Lighthouse CI perf gate)
- Contract list query: < 500ms for up to 500 contracts
- Dashboard query: < 1 second

### Security
- API routes validate session server-side on every request
- Role checks enforced before any DB operation
- Supabase RLS enabled as secondary safety net
- `SUPABASE_SERVICE_ROLE_KEY` never in client bundle
- PDF Storage bucket private; signed URLs with 15-min expiry
- HTTPS enforced by Vercel
- OWASP Top 10 addressed (see Section 9.4)
- Zod input validation on all API routes

### Accessibility
- shadcn/ui components WCAG 2.1 AA compliant (Radix UI)
- Traffic-light indicators include text labels (not colour-only)
- All interactive elements keyboard-navigable

### Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 14. Open Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Handoff within Sprint 2 blocked if M2.1 slips | Medium | High | M2.1 has a hard deadline of Apr 7. If Raj is behind by Apr 6, cut dashboard to counts-only and defer risk lib to start of Vineela's work. |
| Resend email delivery setup delays Sprint 3 | Low | Medium | Fall back to in-app alerts only. Cut order #3 applies. |
| Alert cron fires duplicate notifications due to cron overlap | Medium | Low | Unique index on `(contract_id, threshold_days)` makes duplicates impossible at DB level. |
| Lighthouse perf gate blocks PRs unexpectedly | Low | Low | Gate is warning-only in Sprints 1–2. Becomes blocking in Sprint 3 only. |
| Supabase free tier storage quota hit during demo | Low | Medium | 1GB free tier. Enforce 10MB per PDF limit. Unlikely to hit with seed data. |
| Framer Motion animations degrading performance on dashboard | Medium | Low | Gate via `prefers-reduced-motion`. Strip animations before presentation if needed. |
| Vineela blocked on unfamiliar codebase at start of Sprint 2 | Medium | Medium | Raj writes clear README + CLAUDE.md before handoff. All code follows conventions in CLAUDE.md. |

---

*PRD prepared for Contracker by Raj Laskar and Vineela Goli.*  
*All functional requirements traceable to the project proposal.*  
*Acceptance criteria double as test specifications — written before implementation per TDD workflow.*  
*All CI/CD, monitoring, and security requirements are first-class deliverables, not afterthoughts.*
