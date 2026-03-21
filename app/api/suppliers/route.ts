// TODO: Implement GET and POST for suppliers (M1.2)
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: [], error: null })
}

export async function POST() {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
