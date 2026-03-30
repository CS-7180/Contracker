/**
 * POST /api/contracts/[id]/upload
 * Issue #11 [M1.3] — PDF upload to Supabase Storage
 *
 * Accepts multipart/form-data with a 'pdf' field.
 * Validates MIME type (application/pdf) and size (≤ 10 MB) server-side.
 * Uploads to the private 'contract-pdfs' bucket with a UUID-based filename.
 * Stores the storage path (not a signed URL) in contracts.pdf_url so that
 * issue #12 (contract detail page) can generate fresh signed URLs on load.
 *
 * AC-03-4: Valid PDF → pdf_url stored and accessible via signed URL
 * AC-03-5: Non-PDF file → 400 with error message
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(
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

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid form data', code: '400' } },
      { status: 400 }
    )
  }

  const file = formData.get('pdf')

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { data: null, error: { message: 'No file provided', code: '400' } },
      { status: 400 }
    )
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { data: null, error: { message: 'Only PDF files are accepted', code: '400' } },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { data: null, error: { message: 'File exceeds 10 MB size limit', code: '400' } },
      { status: 400 }
    )
  }

  const filename = `${crypto.randomUUID()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('contract-pdfs')
    .upload(filename, file, { contentType: 'application/pdf' })

  if (uploadError) {
    return NextResponse.json(
      { data: null, error: { message: uploadError.message, code: '500' } },
      { status: 500 }
    )
  }

  const { error: updateError } = await (supabase.from('contracts') as any)
    .update({ pdf_url: filename })
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json(
      { data: null, error: { message: updateError.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { pdf_url: filename }, error: null })
}
