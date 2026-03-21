/**
 * SETUP VALIDATION TESTS
 *
 * These tests verify that all required environment variables and
 * package imports are correctly configured before development begins.
 *
 * TDD RED: These tests will FAIL until .env.test is populated with real values.
 * TDD GREEN: Populate .env.test (copy from .env.local.example) to make them pass.
 */
import { describe, it, expect } from 'vitest'

describe('Required Environment Variables', () => {
  it('NEXT_PUBLIC_SUPABASE_URL is defined and non-empty', () => {
    expect(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      'Missing NEXT_PUBLIC_SUPABASE_URL — copy .env.local.example to .env.test and fill in values'
    ).toBeTruthy()
  })

  it('NEXT_PUBLIC_SUPABASE_URL is a valid URL', () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(url).toBeTruthy()
    expect(() => new URL(url!)).not.toThrow()
    expect(url).toMatch(/\.supabase\.co$/)
  })

  it('NEXT_PUBLIC_SUPABASE_ANON_KEY is defined and non-empty', () => {
    expect(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ).toBeTruthy()
  })

  it('SUPABASE_SERVICE_ROLE_KEY is defined and non-empty', () => {
    expect(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Missing SUPABASE_SERVICE_ROLE_KEY'
    ).toBeTruthy()
  })

  it('RESEND_API_KEY is defined and non-empty', () => {
    expect(
      process.env.RESEND_API_KEY,
      'Missing RESEND_API_KEY'
    ).toBeTruthy()
  })

  it('SENTRY_DSN is defined and non-empty', () => {
    expect(
      process.env.SENTRY_DSN,
      'Missing SENTRY_DSN'
    ).toBeTruthy()
  })
})

describe('Required Package Imports', () => {
  it('can import @supabase/supabase-js createClient', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    expect(createClient).toBeDefined()
    expect(typeof createClient).toBe('function')
  })

  it('can import zod z', async () => {
    const { z } = await import('zod')
    expect(z).toBeDefined()
    expect(typeof z.object).toBe('function')
  })

  it('can import framer-motion motion', async () => {
    const { motion } = await import('framer-motion')
    expect(motion).toBeDefined()
  })

  it('can import recharts BarChart', async () => {
    const { BarChart } = await import('recharts')
    expect(BarChart).toBeDefined()
  })

  it('can import resend Resend', async () => {
    const { Resend } = await import('resend')
    expect(Resend).toBeDefined()
    expect(typeof Resend).toBe('function')
  })
})
