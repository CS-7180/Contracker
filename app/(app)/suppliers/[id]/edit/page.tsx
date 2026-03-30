import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SupplierEditForm from './SupplierEditForm'

export default async function EditSupplierPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // Cast needed: Supabase strict generics don't resolve select result types correctly.
  const { data: supplier, error } = await (supabase.from('suppliers') as any)
    .select('id, name, contact_name, contact_email, contact_phone, category, status')
    .eq('id', params.id)
    .single() as {
      data: {
        id: string
        name: string
        contact_name: string | null
        contact_email: string | null
        contact_phone: string | null
        category: string | null
        status: string
      } | null
      error: unknown
    }

  if (error || !supplier) notFound()

  return <SupplierEditForm supplier={supplier} />
}
