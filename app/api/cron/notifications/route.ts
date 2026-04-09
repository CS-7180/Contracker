import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { shouldSendAlert, ALERT_THRESHOLDS } from '@/lib/alerts'

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

  // Fetch all contracts with future renewal dates + owner info
  const { data: contracts, error: contractsError } = await (supabase.from('contracts') as any)
    .select('id, renewal_date, notice_period_days, created_by')

  if (contractsError) {
    return NextResponse.json(
      { data: null, error: { message: contractsError.message, code: '500' } },
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
          { data: null, error: { message: insertError.message, code: '500' } },
          { status: 500 }
        )
      }

      if (!insertError) inserted++
    }
  }

  return NextResponse.json({ data: { inserted }, error: null })
}
