import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCertificationStatus } from '@/lib/risk'

const GetQuerySchema = z.object({
  supplier_id: z.string().uuid(),
})

const CreateCertSchema = z.object({
  supplier_id: z.string().uuid(),
  cert_type: z.enum(['ISO', 'NDA', 'insurance', 'other']),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  document_url: z.string().url().optional(),
})

export async function GET(req: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const parsed = GetQuerySchema.safeParse({ supplier_id: searchParams.get('supplier_id') ?? undefined })

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: 'supplier_id query param is required and must be a UUID', code: '400' } },
      { status: 400 }
    )
  }

  const { supplier_id } = parsed.data

  // Cast needed: certifications table type not in generated types yet
  const { data: certs, error } = await (supabase.from('certifications') as any)
    .select('*')
    .eq('supplier_id', supplier_id)
    .order('expiry_date', { ascending: true })

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: '500' } },
      { status: 500 }
    )
  }

  const today = new Date()
  const certsWithStatus = (certs as any[]).map(cert => ({
    ...cert,
    status: getCertificationStatus(new Date(cert.expiry_date), today),
  }))

  return NextResponse.json({ data: certsWithStatus, error: null })
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
      { data: null, error: { message: 'Invalid JSON body', code: '400' } },
      { status: 400 }
    )
  }

  const parsed = CreateCertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: parsed.error.errors[0]?.message ?? 'Validation error', code: '400' } },
      { status: 400 }
    )
  }

  // Cast needed: certifications table not in generated types yet
  const { data: cert, error } = await (supabase.from('certifications') as any)
    .insert({ ...parsed.data, created_by: user.id })
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

  return NextResponse.json({ data: certWithStatus, error: null }, { status: 201 })
}
