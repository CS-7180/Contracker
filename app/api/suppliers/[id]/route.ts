// DELETE enforced admin-only in M1.1. GET and PUT implemented in M1.2.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

// Empty strings for optional fields are treated as "not provided"
const emptyToUndefined = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())
const emptyToUndefinedEmail = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().email().optional()
)

const supplierUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  contact_name: emptyToUndefined,
  contact_email: emptyToUndefinedEmail,
  contact_phone: emptyToUndefined,
  category: emptyToUndefined,
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const { data: supplier, error } = await supabase
    .from('suppliers')
    .select('*, contracts(*), certifications(*)')
    .eq('id', params.id)
    .single()

  if (error || !supplier) {
    return NextResponse.json(
      { data: null, error: { message: 'Not found', code: '404' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: supplier, error: null })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid JSON', code: '400' } },
      { status: 400 }
    )
  }

  const result = supplierUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: { message: result.error.errors[0].message, code: '400' } },
      { status: 400 }
    )
  }

  // Cast needed: Supabase strict generics don't resolve partial Update types correctly.
  const { data: supplier, error } = await (supabase.from('suppliers') as any)
    .update(result.data)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: supplier, error: null })
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
