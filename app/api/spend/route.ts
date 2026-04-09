import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const SpendQuerySchema = z.object({
  period: z.enum(['all', 'year', 'custom']).default('all'),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().optional(),
})

type SupplierSpend = { supplier_id: string; supplier_name: string; total: number }
type CategorySpend = { category: string; total: number }

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
  const parsed = SpendQuerySchema.safeParse({
    period: searchParams.get('period') ?? undefined,
    start: searchParams.get('start') ?? undefined,
    end: searchParams.get('end') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid query parameters', code: '400' } },
      { status: 400 }
    )
  }

  const { period, start, end, category } = parsed.data

  let query = (supabase.from('contracts') as any).select(
    'id, value, category, start_date, end_date, supplier_id, suppliers(name)'
  )

  if (period === 'year') {
    const year = new Date().getFullYear()
    query = query.gte('start_date', `${year}-01-01`).lte('start_date', `${year}-12-31`)
  } else if (period === 'custom' && start && end) {
    query = query.gte('start_date', start).lte('start_date', end)
  }

  const { data: contracts, error } = await query

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message, code: '500' } },
      { status: 500 }
    )
  }

  const today = new Date()

  // Filter: non-expired contracts, and optionally by category (app-layer)
  const filtered = (contracts as any[]).filter(c => {
    if (new Date(c.end_date) < today) return false
    if (category && c.category !== category) return false
    return true
  })

  // Aggregate by supplier
  const supplierMap = new Map<string, SupplierSpend>()
  for (const c of filtered) {
    if (c.value == null) continue
    const existing = supplierMap.get(c.supplier_id)
    if (existing) {
      existing.total += c.value
    } else {
      supplierMap.set(c.supplier_id, {
        supplier_id: c.supplier_id,
        supplier_name: (c.suppliers as any)?.name ?? 'Unknown',
        total: c.value,
      })
    }
  }

  // Aggregate by category
  const categoryMap = new Map<string, CategorySpend>()
  for (const c of filtered) {
    if (c.value == null) continue
    const cat = c.category ?? 'Uncategorized'
    const existing = categoryMap.get(cat)
    if (existing) {
      existing.total += c.value
    } else {
      categoryMap.set(cat, { category: cat, total: c.value })
    }
  }

  const bySupplier = Array.from(supplierMap.values()).sort((a, b) => b.total - a.total)
  const byCategory = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)

  return NextResponse.json({ data: { bySupplier, byCategory }, error: null })
}
