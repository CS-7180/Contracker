// PRIMARY TDD TARGET — implement via TDD in M2.3
// Function: shouldSendAlert()
// Tests: __tests__/lib/alerts.test.ts

export const ALERT_THRESHOLDS = [60, 30, 7] as const
export type AlertThreshold = typeof ALERT_THRESHOLDS[number]

// TODO: Implement in M2.3 (RED commit in __tests__/lib/alerts.test.ts first)
export function shouldSendAlert(
  renewalDate: Date,
  threshold: AlertThreshold,
  today: Date = new Date()
): boolean {
  throw new Error('Not implemented — write tests first (TDD red commit)')
}
