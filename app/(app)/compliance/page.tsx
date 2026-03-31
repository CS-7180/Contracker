import { ShieldCheck } from 'lucide-react'
import { ComingSoonPage } from '@/components/ui/ComingSoonPage'

export default function CompliancePage() {
  return (
    <ComingSoonPage
      icon={ShieldCheck}
      iconGradient="from-violet-500 to-purple-600"
      title="Compliance Center"
      description="Track supplier certifications, manage compliance documents, and monitor expiry dates across your entire supplier network with traffic-light risk indicators."
      sprintLabel="Arriving in Sprint 3 · M3.2"
      features={[
        'Certification CRUD per supplier (ISO, NDA, Insurance)',
        'Auto-computed valid / expiring / expired status',
        'Document upload with signed URL access',
        'Portfolio-wide compliance summary dashboard',
      ]}
    />
  )
}
