import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: '401' } },
      { status: 401 }
    )
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*, contracts(id, name, renewal_date, suppliers(name))')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: notifications, error: null })
}
