'use client'

import { Users } from 'lucide-react'
import { ComingSoonPage } from '@/components/ui/ComingSoonPage'

export default function TeamSettingsPage() {
  return (
    <ComingSoonPage
      icon={Users}
      iconGradient="from-blue-500 to-cyan-600"
      title="Team Management"
      description="Invite team members via email, manage Admin and Member roles, and control workspace access — all from one place."
      sprintLabel="Arriving in Sprint 3 · M3.3"
      features={[
        'Email-based member invitations',
        'Admin / Member role management',
        'View pending and active invitations',
        'Promote or demote member roles',
      ]}
    />
  )
}
