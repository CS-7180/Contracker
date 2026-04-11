/**
 * UTILS TESTS — Issue #77 [Coverage gate]
 *
 * Pure utility functions in lib/utils.ts:
 *   - formatCurrency()  — formats a number as USD with no decimal places
 *   - formatDate()      — formats a date string or Date to "Mon D, YYYY" locale string
 *   - todayISODate()    — returns today as "YYYY-MM-DD"
 *   - cn()              — merges Tailwind class strings
 */

import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, todayISODate, cn } from '@/lib/utils'

// ─── formatCurrency() ─────────────────────────────────────────────────────────

describe('formatCurrency()', () => {
  it('formats a positive number as USD with no decimals', () => {
    const result = formatCurrency(12500)
    expect(result).toMatch(/\$12,500/)
  })

  it('formats zero as $0', () => {
    expect(formatCurrency(0)).toMatch(/\$0/)
  })

  it('returns em-dash for null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—')
  })

  it('formats a large value with commas', () => {
    const result = formatCurrency(1_000_000)
    expect(result).toMatch(/1,000,000/)
  })
})

// ─── formatDate() ─────────────────────────────────────────────────────────────

describe('formatDate()', () => {
  it('formats an ISO date string to locale format (contains year)', () => {
    // Avoid checking day number — new Date('YYYY-MM-DD') is UTC midnight, which
    // shifts to the previous day in negative-offset timezones.
    const result = formatDate('2025-06-15')
    expect(result).toMatch(/2025/)
    expect(result).toMatch(/Jun|6/)
  })

  it('formats a Date object (noon UTC avoids timezone day-shift)', () => {
    const d = new Date('2024-03-20T12:00:00Z')
    const result = formatDate(d)
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/Mar|3/)
  })

  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns em-dash for empty string', () => {
    expect(formatDate('')).toBe('—')
  })
})

// ─── todayISODate() ───────────────────────────────────────────────────────────

describe('todayISODate()', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = todayISODate()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches the current date', () => {
    const result = todayISODate()
    const expected = new Date().toISOString().split('T')[0]
    expect(result).toBe(expected)
  })
})

// ─── cn() ─────────────────────────────────────────────────────────────────────

describe('cn()', () => {
  it('merges two class strings', () => {
    expect(cn('text-red-500', 'font-bold')).toBe('text-red-500 font-bold')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toContain('text-blue-500')
    expect(result).not.toContain('text-red-500')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })
})
