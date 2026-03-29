/**
 * LOGIN PAGE TESTS — Issue #5 [M1.1]
 *
 * TDD RED  🔴 — these tests FAIL until the login page is implemented.
 * TDD GREEN 🟢 — tests pass after implementation.
 *
 * AC-01-2: Valid email/password → session created, redirect to /dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush, replace: vi.fn() })),
  usePathname: vi.fn(() => '/login'),
}))

// Mock Supabase client
const mockSignInWithPassword = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}))

import LoginPage from '@/app/(auth)/login/page'

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs and a submit button', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByLabelText(/password/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined()
  })

  it('renders a link to the signup page', () => {
    render(<LoginPage />)

    const link = screen.getByRole('link', { name: /sign up/i })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/signup')
  })

  it('calls supabase signInWithPassword on form submit', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ data: { user: { id: '1' } }, error: null })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('redirects to /dashboard on successful login', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ data: { user: { id: '1' } }, error: null })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows an error message on invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeDefined()
    })
  })
})
