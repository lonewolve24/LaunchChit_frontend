import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { LoginPage } from './login'

describe('LoginPage', () => {
  it('renders the email input by default', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })

  it('renders the password input', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  it('renders the sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('renders the forgot password link', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })

  it('renders the remember me toggle', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
  })

  it('toggles to phone input when phone tab is selected', async () => {
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /^phone$/i }))
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
  })

  it('shows inline error when submitting empty email', async () => {
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows inline error for invalid email format', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email address/i), 'notanemail')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows inline error when password is missing', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email address/i), 'musa@example.com')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows inline error for invalid phone number', async () => {
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /^phone$/i }))
    await userEvent.type(screen.getByLabelText(/phone number/i), 'abc')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    render(<LoginPage />)
    const password = screen.getByLabelText(/^password$/i) as HTMLInputElement
    expect(password.type).toBe('password')
    await userEvent.click(screen.getByRole('button', { name: /show password/i }))
    expect(password.type).toBe('text')
  })
})
