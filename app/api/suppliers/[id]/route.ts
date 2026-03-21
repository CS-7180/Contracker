// TODO: Implement GET, PUT, DELETE for single supplier (M1.2)
// DELETE is Admin-only (soft delete — set status = 'inactive')
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}
