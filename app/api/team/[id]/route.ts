// TODO: Implement PUT (update role) and DELETE (remove member) — Admin only (M3.3)
import { NextResponse } from 'next/server'

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
