// TODO: Implement GET for spend totals by supplier and category (M3.1)
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
