// TODO: Implement GET for dashboard stats (M2.1)
// Returns: counts by status, expiring-soon list, total portfolio value
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
