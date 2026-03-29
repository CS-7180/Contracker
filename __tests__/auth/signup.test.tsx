/**
 * SIGNUP PAGE TESTS — Issue #5 [M1.1]
 *
 * TDD RED  🔴 — these tests FAIL until the signup page is implemented.
 * TDD GREEN 🟢 — tests pass after implementation.
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

// Mock Supabase client
const mockSignUp = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
    },
  })),
}))

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

  it('calls supabase signUp with email, password, and full_name metadata', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: { id: '1' } }, error: null })

    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'Test User' },
        },
      })
    })
  })

  it('redirects to /dashboard on successful signup', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: { id: '1' } }, error: null })

    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows an error message when signup fails', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User already registered' },
    })

    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/user already registered/i)).toBeDefined()
    })
  })
})
