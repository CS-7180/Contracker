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

export type CertificationStatus = 'valid' | 'expiring' | 'expired'

export function getCertificationStatus(
  expiryDate: Date,
  today: Date = new Date()
): CertificationStatus {
  // Truncate both to midnight (dates stored as DATE type, parsed as midnight UTC)
  const todayMidnight = new Date(today.toISOString().split('T')[0] + 'T00:00:00Z')
  const expiryMidnight = new Date(expiryDate.toISOString().split('T')[0] + 'T00:00:00Z')
  if (expiryMidnight <= todayMidnight) return 'expired'
  if (diffInDays(expiryMidnight, todayMidnight) <= 30) return 'expiring'
  return 'valid'
}
