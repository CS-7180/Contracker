import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Empty strings for optional fields are treated as "not provided"
const emptyToUndefined = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())
const emptyToNullableNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.number().positive().optional()
)

const contractSchema = z.object({
  contract_number: emptyToUndefined,
  name: z.string().min(1),
  type: z.enum(['service', 'purchase', 'lease', 'other']),
  supplier_id: z.string().uuid(),
  category: emptyToUndefined,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  renewal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notice_period_days: z.preprocess(
    (v) => (v === '' || v === undefined ? 30 : Number(v)),
    z.number().int().positive().default(30)
  ),
  value: emptyToNullableNumber,
}).refine(
  (d) => d.end_date >= d.start_date,
  { message: 'End date must be on or after start date', path: ['end_date'] }
).refine(
  (d) => d.renewal_date <= d.end_date,
  { message: 'Renewal date must be on or before end date', path: ['renewal_date'] }
)

export async function GET(_req: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('*, suppliers(id, name)')
    .order('renewal_date')

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: contracts, error: null })
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

  const result = contractSchema.safeParse(body)
  if (!result.success) {
    const err = result.error.errors[0]
    const field = err.path.length > 0 ? `${err.path[0]}: ` : ''
    return NextResponse.json(
      { data: null, error: { message: `${field}${err.message}`, code: '400' } },
      { status: 400 }
    )
  }

  const contractNumber =
    result.data.contract_number ??
    `CON-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

  // Cast needed: Supabase strict generics don't resolve Insert types correctly.
  const { data: contract, error } = await (supabase.from('contracts') as any)
    .insert({
      ...result.data,
      contract_number: contractNumber,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: contract, error: null }, { status: 201 })
}
