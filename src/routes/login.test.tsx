import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { LoginPage } from './login'

describe('LoginPage', () => {
  it('renders the email input', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders the send magic link button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
  })

  it('shows inline error when submitting an empty email', async () => {
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /send magic link/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows inline error for an invalid email format', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'notanemail')
    await userEvent.click(screen.getByRole('button', { name: /send magic link/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows confirmation state after a successful send', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'musa@example.com')
    await userEvent.click(screen.getByRole('button', { name: /send magic link/i }))
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  it('shows a resend link in confirmation state', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'musa@example.com')
    await userEvent.click(screen.getByRole('button', { name: /send magic link/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
    })
  })

  it('returns to email input when "use a different email" is clicked', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'musa@example.com')
    await userEvent.click(screen.getByRole('button', { name: /send magic link/i }))
    await waitFor(() => screen.getByRole('button', { name: /different email/i }))
    await userEvent.click(screen.getByRole('button', { name: /different email/i }))
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })
})
