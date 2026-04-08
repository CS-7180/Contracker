/**
 * SIGNUP PAGE TESTS — Issue #5 [M1.1]
 *
 * TDD GREEN 🟢 — signup now routes through /api/auth/signup (server-side admin client)
 * to bypass Supabase GoTrue domain allowlist restrictions.
 *
 * AC-01-2: Valid signup → session created, redirect to /dashboard
 * Signup creates a profiles row with role = 'admin' (handled by Supabase auth trigger)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush, replace: vi.fn() })),
  usePathname: vi.fn(() => '/signup'),
}))

// Mock Supabase client (used for signInWithPassword after account creation)
const mockSignInWithPassword = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}))

// Mock global fetch (used to call /api/auth/signup)
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import SignupPage from '@/app/(auth)/signup/page'

describe('Signup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email, password, and full name inputs with a submit button', () => {
    render(<SignupPage />)

    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByLabelText(/^password$/i)).toBeDefined()
    expect(screen.getByLabelText(/full name/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDefined()
  })

  it('renders a link to the login page', () => {
    render(<SignupPage />)

    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/login')
  })

  it('calls /api/auth/signup with email, password, and full_name on submit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { user: { id: '1', email: 'test@example.com' } }, error: null }),
    })
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })

    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123', full_name: 'Test User' }),
      })
    })
  })

  it('redirects to /dashboard on successful signup', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { user: { id: '1', email: 'test@example.com' } }, error: null }),
    })
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })

    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows an error message when signup API returns an error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ data: null, error: { message: 'An account with this email already exists', code: '409' } }),
    })

    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/an account with this email already exists/i)).toBeDefined()
    })
  })
})
