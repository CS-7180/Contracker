// TODO: Implement GET (list members) — Admin only (M3.3)
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
