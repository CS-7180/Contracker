import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(_req: Request) {
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

  const { data: members, error } = await (supabase.from('profiles') as any)
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: true }) as { data: unknown[] | null; error: unknown }

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch team members', code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: members, error: null })
}
