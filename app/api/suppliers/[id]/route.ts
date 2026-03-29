// GET and PUT implemented in M1.2. DELETE enforces Admin-only now (M1.1).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(_req: Request, { params: _params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}

export async function PUT(_req: Request, { params: _params }: { params: { id: string } }) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented', code: '501' } }, { status: 501 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const { profile: _profile, error: roleError } = await requireAdmin(supabase, user.id)
  if (roleError) return roleError

  // Soft delete — preserves linked contracts (ON DELETE RESTRICT).
  // Cast needed: Supabase strict generics don't resolve partial Update types correctly.
  const { error } = await (supabase.from('suppliers') as any)
    .update({ status: 'inactive' })
    .eq('id', params.id)
  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { id: params.id }, error: null })
}
