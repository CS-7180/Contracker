import { diffInDays } from '@/lib/risk'

export const ALERT_THRESHOLDS = [60, 30, 7] as const
export type AlertThreshold = typeof ALERT_THRESHOLDS[number]

export function shouldSendAlert(
  renewalDate: Date,
  threshold: AlertThreshold,
  today: Date = new Date()
): boolean {
  return diffInDays(renewalDate, today) === threshold
}
