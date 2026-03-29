// TDD RED — failing tests for getContractStatus() and getRiskColour()
// Fixed today: 2025-06-15 for determinism
import { describe, it, expect } from 'vitest'
import { getContractStatus, getRiskColour } from '@/lib/risk'

const TODAY = new Date('2025-06-15')

describe('risk.ts', () => {
  describe('getContractStatus()', () => {
    it('returns expired when end_date is in the past', () => {
      const endDate = new Date('2025-05-01')     // past
      const renewalDate = new Date('2025-04-15') // also past
      expect(getContractStatus(endDate, renewalDate, 30, TODAY)).toBe('expired')
    })

    it('returns expiring when renewal_date is within notice_period_days', () => {
      const endDate = new Date('2025-09-01')     // future
      const renewalDate = new Date('2025-06-25') // 10 days away, inside 30-day notice
      expect(getContractStatus(endDate, renewalDate, 30, TODAY)).toBe('expiring')
    })

    it('returns active for all other cases', () => {
      const endDate = new Date('2025-12-31')     // future
      const renewalDate = new Date('2025-10-01') // 108 days away, outside 30-day notice
      expect(getContractStatus(endDate, renewalDate, 30, TODAY)).toBe('active')
    })
  })

  describe('getRiskColour()', () => {
    it('returns green when renewal_date is more than 60 days away', () => {
      const renewalDate = new Date('2025-09-01') // 78 days away
      expect(getRiskColour(renewalDate, 30, TODAY)).toBe('green')
    })

    it('returns amber when renewal_date is within 60 days but outside notice_period_days', () => {
      const renewalDate = new Date('2025-07-15') // 30 days away, equals notice period
      // exactly at notice boundary: 30 days → red, so use 31 days for amber
      const renewalDateAmber = new Date('2025-07-16') // 31 days away
      expect(getRiskColour(renewalDateAmber, 30, TODAY)).toBe('amber')
    })

    it('returns red when renewal_date is within notice_period_days', () => {
      const renewalDate = new Date('2025-06-25') // 10 days away, inside 30-day notice
      expect(getRiskColour(renewalDate, 30, TODAY)).toBe('red')
    })

    it('returns red when renewal_date is exactly today', () => {
      const renewalDate = new Date('2025-06-15') // same as TODAY
      expect(getRiskColour(renewalDate, 30, TODAY)).toBe('red')
    })
  })
})
