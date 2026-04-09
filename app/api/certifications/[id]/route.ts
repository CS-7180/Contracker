import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCertificationStatus } from '@/lib/risk'
import { requireAdmin } from '@/lib/auth'

const UUIDParam = z.string().uuid()

const UpdateCertSchema = z.object({
  cert_type: z.enum(['ISO', 'NDA', 'insurance', 'other']).optional(),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  document_url: z.string().url().optional(),
}).strict()

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  // Validate path param is a UUID (A03 defense-in-depth)
  if (!UUIDParam.safeParse(params.id).success) {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid id', code: '400' } },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid JSON body', code: '400' } },
      { status: 400 }
    )
  }

  const parsed = UpdateCertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: parsed.error.errors[0]?.message ?? 'Validation error', code: '400' } },
      { status: 400 }
    )
  }

  // Fetch-first: confirm cert exists before updating (A01 — prevents existence leakage)
  const { data: existing, error: fetchError } = await (supabase.from('certifications') as any)
    .select('id')
    .eq('id', params.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json(
      { data: null, error: { message: 'Certification not found', code: '404' } },
      { status: 404 }
    )
  }

  const { data: cert, error } = await (supabase.from('certifications') as any)
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: '500' } },
      { status: 500 }
    )
  }

  const certWithStatus = {
    ...(cert as any),
    status: getCertificationStatus(new Date((cert as any).expiry_date)),
  }

  return NextResponse.json({ data: certWithStatus, error: null })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  // Validate path param is a UUID (A03 defense-in-depth)
  if (!UUIDParam.safeParse(params.id).success) {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid id', code: '400' } },
      { status: 400 }
    )
  }

  const { error: roleError } = await requireAdmin(supabase, user.id)
  if (roleError) return roleError

  const { error } = await (supabase.from('certifications') as any)
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: null, error: null })
}
