// TODO: Implement GET (unread notifications for current user) (M2.3)
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: [], error: null })
}
