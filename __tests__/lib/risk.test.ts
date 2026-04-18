// TDD RED — failing tests for getContractStatus() and getRiskColour()
// Fixed today: 2025-06-15 for determinism
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
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

// ─── Property-based tests (fast-check) ───────────────────────────────────────
// AC-PBT-1 through AC-PBT-8

const FIXED_TODAY = new Date('2026-04-18')

// Bound all date arbitraries with both min and max to prevent new Date(NaN) generation
const pastDate = fc.date({ min: new Date('2000-01-01'), max: new Date('2026-04-17T23:59:59.999Z') })
const futureOrTodayDate = fc.date({ min: new Date('2026-04-18T00:00:00.000Z'), max: new Date('2031-12-31') })
const anyDate = fc.date({ min: new Date('2000-01-01'), max: new Date('2031-12-31') })
const noticePeriod = fc.integer({ min: 1, max: 365 })

describe('getContractStatus() — property-based (AC-PBT-1–3)', () => {
  it('AC-PBT-1: always expired when endDate is strictly before today', () => {
    fc.assert(
      fc.property(pastDate, anyDate, noticePeriod, (endDate, renewalDate, npd) => {
        expect(getContractStatus(endDate, renewalDate, npd, FIXED_TODAY)).toBe('expired')
      })
    )
  })

  it('AC-PBT-2: always expiring when endDate >= today AND daysToRenewal <= noticePeriodDays', () => {
    fc.assert(
      fc.property(
        futureOrTodayDate,
        noticePeriod,
        (endDate, npd) => {
          // Construct renewalDate so it is exactly npd days from today (i.e., at the boundary → red/expiring)
          const renewalDate = new Date(FIXED_TODAY)
          renewalDate.setDate(renewalDate.getDate() + npd)
          // ensure renewalDate <= endDate (schema constraint), advance endDate if needed
          const safeEndDate = endDate < renewalDate ? renewalDate : endDate
          expect(getContractStatus(safeEndDate, renewalDate, npd, FIXED_TODAY)).toBe('expiring')
        }
      )
    )
  })

  it('AC-PBT-3: always active when endDate >= today AND daysToRenewal > noticePeriodDays', () => {
    fc.assert(
      fc.property(
        futureOrTodayDate,
        noticePeriod,
        fc.integer({ min: 1, max: 200 }),
        (endDate, npd, extraDays) => {
          // renewalDate is npd + extraDays beyond today → outside notice window
          const renewalDate = new Date(FIXED_TODAY)
          renewalDate.setDate(renewalDate.getDate() + npd + extraDays)
          const safeEndDate = endDate < renewalDate ? renewalDate : endDate
          expect(getContractStatus(safeEndDate, renewalDate, npd, FIXED_TODAY)).toBe('active')
        }
      )
    )
  })
})

describe('getRiskColour() — property-based (AC-PBT-4–8)', () => {
  it('AC-PBT-4: always red when daysToRenewal <= noticePeriodDays', () => {
    fc.assert(
      fc.property(noticePeriod, fc.integer({ min: 0 }), (npd, offset) => {
        // renewalDate is today + (npd - offset % (npd+1)) → between 0 and npd days away
        const daysAway = npd - (offset % (npd + 1))
        const renewalDate = new Date(FIXED_TODAY)
        renewalDate.setDate(renewalDate.getDate() + daysAway)
        expect(getRiskColour(renewalDate, npd, FIXED_TODAY)).toBe('red')
      })
    )
  })

  it('AC-PBT-5: always amber when noticePeriodDays < daysToRenewal <= 60', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 59 }),  // noticePeriodDays < 60
        (npd) => {
          // daysToRenewal = npd + 1  (just outside notice, still ≤ 60 only when npd < 60)
          const daysAway = npd + 1
          if (daysAway > 60) return  // skip if constraint can't be satisfied
          const renewalDate = new Date(FIXED_TODAY)
          renewalDate.setDate(renewalDate.getDate() + daysAway)
          expect(getRiskColour(renewalDate, npd, FIXED_TODAY)).toBe('amber')
        }
      )
    )
  })

  it('AC-PBT-6: always green when daysToRenewal > 60 and noticePeriodDays < daysToRenewal', () => {
    // Green requires BOTH conditions: daysToRenewal > 60 AND daysToRenewal > noticePeriodDays.
    // Simplest constraint: cap noticePeriodDays at 60 so it can never exceed daysToRenewal.
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 60 }), fc.integer({ min: 61, max: 3650 }), (npd, daysAway) => {
        const renewalDate = new Date(FIXED_TODAY)
        renewalDate.setDate(renewalDate.getDate() + daysAway)
        expect(getRiskColour(renewalDate, npd, FIXED_TODAY)).toBe('green')
      })
    )
  })

  it('AC-PBT-7: always returns exactly one of green | amber | red — never throws', () => {
    const validColours = new Set(['green', 'amber', 'red'])
    fc.assert(
      fc.property(anyDate, noticePeriod, (renewalDate, npd) => {
        const result = getRiskColour(renewalDate, npd, FIXED_TODAY)
        expect(validColours.has(result)).toBe(true)
      })
    )
  })
})
