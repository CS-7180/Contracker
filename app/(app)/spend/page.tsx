import { DollarSign } from 'lucide-react'
import { ComingSoonPage } from '@/components/ui/ComingSoonPage'

export default function SpendPage() {
  return (
    <ComingSoonPage
      icon={DollarSign}
      iconGradient="from-emerald-500 to-teal-600"
      title="Spend Intelligence"
      description="Analyze supplier spend totals, category breakdowns, and contract value distribution across your entire portfolio — with charts and date filters."
      sprintLabel="Arriving in Sprint 3 · M3.1"
      features={[
        'Bar chart — top 10 suppliers by spend',
        'Category breakdown table with totals',
        'Year-over-year date filter',
        'Export spend report to CSV',
      ]}
    />
  )
}
