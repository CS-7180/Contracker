// TODO: Implement GET (list + filters) and POST (create) for contracts (M1.3)
// Auth: Member+  |  POST requires Zod validation
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: [], error: null })
}

export async function POST() {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
