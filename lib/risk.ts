// PRIMARY TDD TARGET — implement via TDD in M2.1
// Functions: getContractStatus(), getRiskColour()
// Tests: __tests__/lib/risk.test.ts

export type ContractStatus = 'active' | 'expiring' | 'expired'
export type RiskColour = 'green' | 'amber' | 'red'

// TODO: Implement in M2.1 (RED commit in __tests__/lib/risk.test.ts first)
export function getContractStatus(
  endDate: Date,
  renewalDate: Date,
  noticePeriodDays: number,
  today: Date = new Date()
): ContractStatus {
  throw new Error('Not implemented — write tests first (TDD red commit)')
}

// TODO: Implement in M2.1 (RED commit in __tests__/lib/risk.test.ts first)
export function getRiskColour(
  renewalDate: Date,
  noticePeriodDays: number,
  today: Date = new Date()
): RiskColour {
  throw new Error('Not implemented — write tests first (TDD red commit)')
}

export function diffInDays(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay)
}
