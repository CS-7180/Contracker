'use client'

import { RiskIndicator } from './RiskIndicator'
import { cn } from '@/lib/utils'

type ContractStatus = 'active' | 'expiring' | 'expired'
type RiskColour = 'green' | 'amber' | 'red'

interface RiskBadgeProps {
  status: ContractStatus
  risk: RiskColour
  size?: 'sm' | 'md'
  className?: string
}

const STATUS_LABEL: Record<ContractStatus, string> = {
  active:   'Active',
  expiring: 'Expiring',
  expired:  'Expired',
}

const RISK_TO_STATUS_MAP: Record<RiskColour, ContractStatus> = {
  green: 'active',
  amber: 'expiring',
  red:   'expired',
}

const BADGE_CLASSES: Record<ContractStatus, string> = {
  active:   'border-emerald-500/20 bg-emerald-500/15 text-emerald-400',
  expiring: 'border-amber-500/20 bg-amber-500/15 text-amber-400',
  expired:  'border-red-500/20 bg-red-500/15 text-red-400',
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

export function RiskBadge({ status, risk, size = 'md', className }: RiskBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        BADGE_CLASSES[status],
        SIZE_CLASSES[size],
        className,
      )}
    >
      <RiskIndicator colour={risk} size="sm" pulse={false} />
      {STATUS_LABEL[status]}
    </span>
  )
}

/** Compute status from risk colour — use when only risk is available */
export function riskToStatus(risk: RiskColour): ContractStatus {
  return RISK_TO_STATUS_MAP[risk]
}
