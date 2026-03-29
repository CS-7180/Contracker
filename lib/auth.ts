import { NextResponse } from 'next/server'
import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = ReturnType<typeof createClient>

type AdminResult =
  | { profile: { role: string }; error: null }
  | { profile: null; error: NextResponse }

/**
 * Server-side admin role check.
 * Pass the Supabase client and the current user's ID.
 * Returns the profile on success or a 403 NextResponse for non-admin sessions.
 */
export async function requireAdmin(
  supabase: SupabaseServerClient,
  userId: string
): Promise<AdminResult> {
  // Type assertion needed: Supabase's select('role') returns a narrowed type
  // that TypeScript can't always resolve at compile time with strict generics.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single() as unknown as { data: { role: string } | null; error: unknown }

  if (profile?.role !== 'admin') {
    return {
      profile: null,
      error: NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: '403' } },
        { status: 403 }
      ),
    }
  }

  return { profile, error: null }
}
