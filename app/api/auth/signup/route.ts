import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
})

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid JSON', code: '400' } },
      { status: 400 }
    )
  }

  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: parsed.error.errors[0].message, code: '400' } },
      { status: 400 }
    )
  }

  const { email, password, full_name } = parsed.data

  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (createError) {
    const isDuplicate =
      createError.message.toLowerCase().includes('already') ||
      createError.message.toLowerCase().includes('duplicate') ||
      createError.message.toLowerCase().includes('exists')
    return NextResponse.json(
      {
        data: null,
        error: {
          message: isDuplicate
            ? 'An account with this email already exists'
            : 'Could not create account',
          code: isDuplicate ? '409' : '500',
        },
      },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  const user = authData.user

  // The handle_new_user trigger now reads full_name from raw_user_meta_data
  // (updated via migration handle_new_user_full_name) — no separate update needed

  return NextResponse.json(
    { data: { user: { id: user.id, email: user.email } }, error: null },
    { status: 201 }
  )
}
