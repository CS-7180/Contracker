# Acceptance Criteria Reference

These ACs double as test specifications. Each must have a corresponding test written **before** implementation (TDD red commit).

## AC-01 — Authentication & Role Management

```
AC-01-1: GIVEN an unauthenticated user WHEN they visit /dashboard THEN they are redirected to /login
AC-01-2: GIVEN valid email/password WHEN submitted THEN a session is created and user is redirected to /dashboard
AC-01-3: GIVEN a Member role user WHEN they call DELETE /api/contracts/:id THEN response status is 403
AC-01-4: GIVEN an Admin role user WHEN they call DELETE /api/contracts/:id THEN contract is deleted and response is 200
```

## AC-02 — Supplier Profile Management

```
AC-02-1: GIVEN a logged-in Member WHEN they submit a valid new supplier form THEN a supplier record is created
AC-02-2: GIVEN a logged-in Member WHEN they call DELETE /api/suppliers/:id THEN response status is 403
AC-02-3: GIVEN a supplier with linked contracts WHEN an Admin deletes the supplier THEN status = 'inactive' and contracts remain intact
AC-02-4: GIVEN a supplier profile page WHEN rendered THEN all linked contracts are listed
```

## AC-03 — Contract Management

```
AC-03-1: GIVEN a valid contract form WHEN saved THEN a record exists in DB with all submitted fields
AC-03-2: GIVEN renewal_date is within notice_period_days of today THEN status = 'expiring'
AC-03-3: GIVEN end_date is in the past THEN status = 'expired'
AC-03-4: GIVEN a PDF under 10MB WHEN uploaded THEN pdf_url is stored and file is accessible
AC-03-5: GIVEN a non-PDF file WHEN upload attempted THEN upload is rejected with error message
AC-03-6: GIVEN a Member user WHEN they call DELETE /api/contracts/:id THEN response status is 403
```

## AC-04 — Contract List, Search & Filter

```
AC-04-1: GIVEN contracts exist WHEN list loads THEN all contracts render with name, supplier, status badge, renewal date, value
AC-04-2: GIVEN a search term matching a contract name WHEN submitted THEN only matching contracts are shown
AC-04-3: GIVEN filter status = 'expiring' is applied THEN only expiring contracts appear
AC-04-4: GIVEN more than 20 contracts WHEN list loads THEN only 20 shown and pagination controls are visible
```

## AC-05 — Basic Dashboard

```
AC-05-1: GIVEN contracts exist WHEN dashboard loads THEN correct count per status is displayed
AC-05-2: GIVEN contracts with renewal_date within 30 days WHEN dashboard loads THEN those contracts appear in expiring-soon list
AC-05-3: GIVEN contracts with known values WHEN dashboard loads THEN total portfolio value equals sum of all active contract values
```

## AC-06 — Traffic-Light Risk Indicators

```
AC-06-1: GIVEN renewal_date > 60 days from today THEN risk colour = 'green'
AC-06-2: GIVEN renewal_date within 60 days but outside notice_period_days THEN risk colour = 'amber'
AC-06-3: GIVEN renewal_date within notice_period_days THEN risk colour = 'red'
AC-06-4: GIVEN a supplier with at least one red contract WHEN supplier list renders THEN supplier shows red indicator
AC-06-5: GIVEN dashboard loads THEN contracts are ordered red → amber → green
```

**Edge cases for risk.ts tests:**
- `renewal_date` = exactly today → `red`
- `today` injected as parameter → deterministic in tests
- `end_date` < today → `expired` takes priority over risk colour

## AC-07 — In-App Renewal Notifications

```
AC-07-1: GIVEN renewal_date is exactly 60 days away WHEN alert cron runs THEN in-app notification is created for contract owner
AC-07-2: GIVEN same contract WHEN cron runs next day THEN no duplicate 60-day notification is created
AC-07-3: GIVEN unread notification exists WHEN user views notifications THEN it shows contract name and days remaining
AC-07-4: GIVEN unread notification WHEN user marks as read THEN unread count decrements
```

## AC-08 — Email Renewal Alerts

```
AC-08-1: GIVEN contract at 30-day threshold WHEN cron runs THEN email sent to contract owner's email address
AC-08-2: GIVEN same contract at same threshold WHEN cron runs again THEN no second email sent
AC-08-3: GIVEN contract owner's email changes THEN next alert uses updated email
```

## AC-09 — Spend Tracking

```
AC-09-1: GIVEN contracts with known values across suppliers WHEN spend page loads THEN each supplier shows correct summed value
AC-09-2: GIVEN a category filter applied THEN only contracts in that category are included in totals
AC-09-3: GIVEN current year filter applied THEN only contracts with start_date in current year are included
```

## AC-10 — Supplier Compliance & Certification Tracking

```
AC-10-1: GIVEN expiry_date > 30 days from today THEN certification status = 'valid'
AC-10-2: GIVEN expiry_date within 30 days THEN certification status = 'expiring'
AC-10-3: GIVEN expiry_date in the past THEN certification status = 'expired'
AC-10-4: GIVEN supplier with at least one expired certification WHEN compliance page loads THEN supplier flagged red
AC-10-5: GIVEN new certification created for supplier THEN it appears on supplier profile and compliance page
```

## AC-11 — Member Invitation Flow

```
AC-11-1: GIVEN Admin submits email invitation THEN pending invite record created and email dispatched
AC-11-2: GIVEN invited user clicks link and sets password THEN profile created with role = 'member'
AC-11-3: GIVEN Admin promotes Member to Admin THEN profiles table updated to role = 'admin'
```

## Test File Mapping

| AC Group | Test File |
|----------|-----------|
| AC-01 | `__tests__/api/auth.test.ts` |
| AC-02 | `__tests__/api/suppliers.test.ts` |
| AC-03, AC-04 | `__tests__/api/contracts.test.ts` |
| AC-05, AC-06 | `__tests__/lib/risk.test.ts` |
| AC-07, AC-08 | `__tests__/lib/alerts.test.ts` |
| AC-09 | `__tests__/api/spend.test.ts` |
| AC-10 | `__tests__/api/certifications.test.ts` |
| AC-11 | `__tests__/api/team.test.ts` |
| E2E happy path | `e2e/contracts.spec.ts` |
