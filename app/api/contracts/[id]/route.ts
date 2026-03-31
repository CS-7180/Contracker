// GET and PUT implemented in M1.3. DELETE enforces Admin-only now (M1.1).
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

// All fields optional for partial updates
const updateContractSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['service', 'purchase', 'lease', 'other']).optional(),
  supplier_id: z.string().uuid().optional(),
  category: z.string().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  renewal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notice_period_days: z.number().int().positive().optional(),
  value: z.number().positive().optional().nullable(),
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

  const { data: contract, error } = await (supabase.from('contracts') as any)
    .select('*, suppliers(id, name)')
    .eq('id', params.id)
    .single()

  if (error || !contract) {
    return NextResponse.json(
      { data: null, error: { message: 'Contract not found', code: '404' } },
      { status: 404 }
    )
  }

  let signed_url: string | null = null
  if (contract.pdf_url) {
    const { data: urlData } = await supabase.storage
      .from('contract-pdfs')
      .createSignedUrl(contract.pdf_url, 900)
    signed_url = urlData?.signedUrl ?? null
  }

  return NextResponse.json({ data: { ...contract, signed_url }, error: null })
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

  const result = updateContractSchema.safeParse(body)
  if (!result.success) {
    const err = result.error.errors[0]
    const field = err.path.length > 0 ? `${err.path[0]}: ` : ''
    return NextResponse.json(
      { data: null, error: { message: `${field}${err.message}`, code: '400' } },
      { status: 400 }
    )
  }

  const { data: contract, error } = await (supabase.from('contracts') as any)
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

  return NextResponse.json({ data: contract, error: null })
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

  const { error } = await supabase.from('contracts').delete().eq('id', params.id)
  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { id: params.id }, error: null })
}
