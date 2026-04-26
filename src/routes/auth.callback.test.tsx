import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthCallbackPage } from './auth.callback'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useSearch: () => ({ token: 'valid-token' }),
    useNavigate: () => mockNavigate,
    createFileRoute: actual.createFileRoute,
  }
})

beforeEach(() => { mockNavigate.mockClear() })

describe('AuthCallbackPage', () => {
  it('renders a loading spinner', () => {
    render(<AuthCallbackPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows loading text', () => {
    render(<AuthCallbackPage />)
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument()
  })
})
