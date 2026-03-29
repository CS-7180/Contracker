// PRIMARY TDD TARGET — implement via TDD in M2.1
// Functions: getContractStatus(), getRiskColour()
// Tests: __tests__/lib/risk.test.ts

export type ContractStatus = 'active' | 'expiring' | 'expired'
export type RiskColour = 'green' | 'amber' | 'red'

export function getContractStatus(
  endDate: Date,
  renewalDate: Date,
  noticePeriodDays: number,
  today: Date = new Date()
): ContractStatus {
  if (endDate < today) return 'expired'
  if (diffInDays(renewalDate, today) <= noticePeriodDays) return 'expiring'
  return 'active'
}

export function getRiskColour(
  renewalDate: Date,
  noticePeriodDays: number,
  today: Date = new Date()
): RiskColour {
  const daysToRenewal = diffInDays(renewalDate, today)
  if (daysToRenewal <= noticePeriodDays) return 'red'
  if (daysToRenewal <= 60) return 'amber'
  return 'green'
}

export function diffInDays(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay)
}
