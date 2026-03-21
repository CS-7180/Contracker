// TODO: Implement PUT (mark as read) for notification (M2.3)
import { NextResponse } from 'next/server'

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
