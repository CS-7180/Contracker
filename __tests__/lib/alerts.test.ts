// TDD RED — failing tests for shouldSendAlert()
// Fixed today: 2025-06-15 for determinism
import { describe, it, expect } from 'vitest'
import { shouldSendAlert } from '@/lib/alerts'

const TODAY = new Date('2025-06-15')

describe('alerts.ts', () => {
  describe('shouldSendAlert()', () => {
    it('returns true when days to renewal equals threshold (60 days)', () => {
      const renewalDate = new Date('2025-08-14') // exactly 60 days from TODAY
      expect(shouldSendAlert(renewalDate, 60, TODAY)).toBe(true)
    })

    it('returns true when days to renewal equals threshold (30 days)', () => {
      const renewalDate = new Date('2025-07-15') // exactly 30 days from TODAY
      expect(shouldSendAlert(renewalDate, 30, TODAY)).toBe(true)
    })

    it('returns true when days to renewal equals threshold (7 days)', () => {
      const renewalDate = new Date('2025-06-22') // exactly 7 days from TODAY
      expect(shouldSendAlert(renewalDate, 7, TODAY)).toBe(true)
    })

    it('returns false when days to renewal does not match the threshold', () => {
      const renewalDate = new Date('2025-07-20') // 35 days away — not 60, 30, or 7
      expect(shouldSendAlert(renewalDate, 60, TODAY)).toBe(false)
    })

    it('is deterministic when today is injected as parameter', () => {
      const renewalDate = new Date('2025-08-14')
      const result1 = shouldSendAlert(renewalDate, 60, TODAY)
      const result2 = shouldSendAlert(renewalDate, 60, TODAY)
      expect(result1).toBe(result2)
      expect(result1).toBe(true)
    })
  })
})
