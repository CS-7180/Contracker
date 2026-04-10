import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { shouldSendAlert, ALERT_THRESHOLDS } from '@/lib/alerts'

const resend = new Resend(process.env.RESEND_API_KEY)

// Escape user-supplied content before embedding in HTML email bodies (A03 Injection)
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Strip newlines from user content before embedding in email headers (A03 header injection)
function sanitizeEmailHeader(str: string): string {
  return str.replace(/[\r\n]/g, ' ').trim()
}

export async function GET(req: Request) {
  // Secure with CRON_SECRET to prevent unauthorized triggering
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const supabase = createClient()

  // Fetch contracts — bounded at 2000 rows to avoid OOM on serverless (A04)
  const { data: contracts, error: contractsError } = await (supabase.from('contracts') as any)
    .select('id, name, renewal_date, notice_period_days, created_by')
    .limit(2000)

  if (contractsError) {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch contracts', code: '500' } },
      { status: 500 }
    )
  }

  const today = new Date()
  let inserted = 0

  for (const contract of contracts as any[]) {
    for (const threshold of ALERT_THRESHOLDS) {
      if (!shouldSendAlert(new Date(contract.renewal_date), threshold, today)) continue

      const message = `Contract renews in ${threshold} days — action required`
      const { error: insertError } = await (supabase.from('notifications') as any).insert({
        contract_id: contract.id,
        user_id: contract.created_by,
        threshold_days: threshold,
        message,
      })

      // Unique index (contract_id, threshold_days) silently prevents duplicates.
      // Postgres error code 23505 = unique_violation — treat as a no-op.
      if (insertError && insertError.code !== '23505') {
        return NextResponse.json(
          { data: null, error: { message: 'Failed to insert notification', code: '500' } },
          { status: 500 }
        )
      }

      if (!insertError) {
        inserted++

        // Send email alert — fetch owner email fresh on each run (satisfies AC-08-3)
        try {
          const { data: profile } = await (supabase.from('profiles') as any)
            .select('email')
            .eq('id', contract.created_by)
            .single() as { data: { email: string } | null; error: unknown }

          if (profile?.email) {
            const safeName = escapeHtml(contract.name)
            await resend.emails.send({
              from: 'onboarding@resend.dev',
              to: profile.email,
              subject: `Renewal alert: ${sanitizeEmailHeader(contract.name)} renews in ${threshold} days`,
              html: `<p>Your contract <strong>${safeName}</strong> is due for renewal in <strong>${threshold} days</strong>. Please take the necessary action to avoid auto-renewal on unfavorable terms.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://contracker.vercel.app'}/contracts">View contracts</a></p>`,
            })
          }
        } catch (emailError) {
          // Email failure must not crash the cron — in-app notification was already created
          console.error(`Failed to send renewal email for contract ${contract.id}:`, emailError)
        }
      }
    }
  }

  return NextResponse.json({ data: { inserted }, error: null })
}
