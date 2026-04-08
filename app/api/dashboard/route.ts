import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getContractStatus, getRiskColour, diffInDays } from '@/lib/risk'

export async function GET(_req: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const { data: contracts, error } = await (supabase.from('contracts') as any)
    .select('id, name, renewal_date, end_date, notice_period_days, value')

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  const today = new Date()
  let active_count = 0
  let expiring_count = 0
  let expired_count = 0
  let green_count = 0
  let amber_count = 0
  let red_count = 0
  let total_value = 0
  const expiring_soon: object[] = []

  for (const c of contracts as any[]) {
    const status = getContractStatus(
      new Date(c.end_date),
      new Date(c.renewal_date),
      c.notice_period_days,
      today
    )

    if (status === 'active') active_count++
    else if (status === 'expiring') expiring_count++
    else expired_count++

    const risk = getRiskColour(new Date(c.renewal_date), c.notice_period_days, today)
    if (risk === 'green') green_count++
    else if (risk === 'amber') amber_count++
    else red_count++

    if (status !== 'expired') {
      total_value += c.value ?? 0

      if (diffInDays(new Date(c.renewal_date), today) <= 30) {
        expiring_soon.push({
          id: c.id,
          name: c.name,
          renewal_date: c.renewal_date,
          end_date: c.end_date,
          notice_period_days: c.notice_period_days,
          value: c.value,
          risk_colour: risk,
        })
      }
    }
  }

  return NextResponse.json({
    data: { active_count, expiring_count, expired_count, green_count, amber_count, red_count, total_value, expiring_soon },
    error: null,
  })
}
