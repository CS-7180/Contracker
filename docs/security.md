# Security Reference

## Input Validation

**All API routes must validate inputs with Zod before any database operation.**

```typescript
import { z } from 'zod'

const contractSchema = z.object({
  name: z.string().min(1),
  supplier_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  renewal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notice_period_days: z.number().int().positive(),
  value: z.number().positive().optional(),
  type: z.enum(['service', 'purchase', 'lease', 'other']),
})

export async function POST(req: Request) {
  const body = await req.json()
  const validated = contractSchema.parse(body)  // Throws if invalid
  // Proceed with validated data...
}
```

## File Upload Constraints

- **Type:** PDF only — check MIME type server-side (`application/pdf`)
- **Size:** 10MB max — check server-side before Storage call
- **Storage:** Supabase Storage private bucket, signed URLs with 15-minute expiry
- **Naming:** UUID-based filenames to prevent collisions and path traversal

## Environment Variables

**Never commit secrets.** All secrets in Vercel Environment Variables.

```
NEXT_PUBLIC_SUPABASE_URL=        # Safe to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Safe to expose
SUPABASE_SERVICE_ROLE_KEY=       # Server-side ONLY — NEVER expose to client
RESEND_API_KEY=                  # Server-side ONLY
SENTRY_DSN=                      # Safe to expose
```

## OWASP Top 10 Checklist

| Risk | Mitigation |
|---|---|
| A01 Broken Access Control | Role checked server-side on every Admin-only route. Supabase RLS as secondary net. |
| A02 Cryptographic Failures | HTTPS via Vercel. Private Storage bucket + signed URLs. No secrets in localStorage. |
| A03 Injection | Supabase parameterized queries. All inputs Zod-validated before DB operations. |
| A04 Insecure Design | Session validated server-side on every API call via `supabase.auth.getUser()`. |
| A05 Security Misconfiguration | No debug endpoints in production. Error messages never expose stack traces. |
| A07 Auth Failures | Supabase Auth handles session expiry, token refresh, brute-force protection. |
| A09 Logging | Sentry captures all server-side errors including auth failures. |
