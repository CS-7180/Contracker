import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

const InviteSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => ({}))
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid input', code: '400' } },
      { status: 400 }
    )
  }

  const { email } = parsed.data
  const adminClient = createAdminClient()
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email)

  if (inviteError) {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to send invitation', code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { email }, error: null })
}
