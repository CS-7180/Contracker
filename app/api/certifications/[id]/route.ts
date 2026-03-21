// TODO: Implement PUT and DELETE for single certification (M3.2)
// DELETE is Admin-only
import { NextResponse } from 'next/server'

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
