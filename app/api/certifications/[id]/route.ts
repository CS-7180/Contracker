import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCertificationStatus } from '@/lib/risk'

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

  const { data: cert, error } = await supabase
    .from('certifications')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { data: null, error: { message: 'Forbidden', code: '403' } },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('certifications')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: null, error: null })
}
