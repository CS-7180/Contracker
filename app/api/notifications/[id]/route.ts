import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  // Verify the notification exists and belongs to the current user
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('id, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !notification) {
    return NextResponse.json(
      { data: null, error: { message: 'Notification not found', code: '404' } },
      { status: 404 }
    )
  }

  // Ownership already verified above — safe to update by id only
  const { error: updateError } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json(
      { data: null, error: { message: updateError.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: null, error: null })
}
