// TODO: Implement POST (send invite) — Admin only (M3.3)
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
