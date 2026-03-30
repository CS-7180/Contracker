import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Empty strings for optional fields are treated as "not provided"
const emptyToUndefined = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())
const emptyToUndefinedEmail = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().email().optional()
)

const supplierSchema = z.object({
  name: z.string().min(1),
  contact_name: emptyToUndefined,
  contact_email: emptyToUndefinedEmail,
  contact_phone: emptyToUndefined,
  category: emptyToUndefined,
})

export async function GET(_req: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: suppliers, error: null })
}

export async function POST(req: Request) {
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

  const result = supplierSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: { message: result.error.errors[0].message, code: '400' } },
      { status: 400 }
    )
  }

  // Cast needed: Supabase strict generics don't resolve Insert types correctly.
  const { data: supplier, error } = await (supabase.from('suppliers') as any)
    .insert({ ...result.data, created_by: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: supplier, error: null }, { status: 201 })
}
