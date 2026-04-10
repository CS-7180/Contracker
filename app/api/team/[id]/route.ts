import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

const UpdateRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const { error: adminError } = await requireAdmin(supabase, user.id)
  if (adminError) return adminError

  // Prevent admins from changing their own role (safety guard)
  if (params.id === user.id) {
    return NextResponse.json(
      { data: null, error: { message: 'Cannot change your own role', code: '403' } },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const parsed = UpdateRoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid role', code: '400' } },
      { status: 400 }
    )
  }

  const { error } = await (supabase.from('profiles') as any)
    .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
    .eq('id', params.id) as { data: unknown; error: unknown }

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to update role', code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: null, error: null })
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

  const { error: adminError } = await requireAdmin(supabase, user.id)
  if (adminError) return adminError

  // Prevent admins from deleting their own account
  if (params.id === user.id) {
    return NextResponse.json(
      { data: null, error: { message: 'Cannot delete your own account', code: '403' } },
      { status: 403 }
    )
  }

  const { error } = await (supabase.from('profiles') as any)
    .delete()
    .eq('id', params.id) as { data: unknown; error: unknown }

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to remove member', code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: null, error: null })
}
