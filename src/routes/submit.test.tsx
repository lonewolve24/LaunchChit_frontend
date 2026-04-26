import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SubmitPage } from './submit'

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return { ...actual, useNavigate: () => mockNavigate, createFileRoute: actual.createFileRoute }
})

describe('SubmitPage', () => {
  it('renders all required fields', () => {
    render(<SubmitPage />)
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tagline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/logo url/i)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    render(<SubmitPage />)
    expect(screen.getByRole('button', { name: /launch it/i })).toBeInTheDocument()
  })

  it('shows errors when submitting empty form', async () => {
    render(<SubmitPage />)
    await userEvent.click(screen.getByRole('button', { name: /launch it/i }))
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })
  })

  it('shows char counter for name field', async () => {
    render(<SubmitPage />)
    await userEvent.type(screen.getByLabelText(/product name/i), 'FarmLink')
    expect(screen.getByText(/8\s*\/\s*80/)).toBeInTheDocument()
  })

  it('navigates to product detail on successful submit', async () => {
    const { server } = await import('../mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.post('http://localhost:8000/products', () =>
        HttpResponse.json({ slug: 'farmlink-gm-a3k9z2' }, { status: 201 })
      )
    )
    render(<SubmitPage />)
    await userEvent.type(screen.getByLabelText(/product name/i), 'FarmLink GM')
    await userEvent.type(screen.getByLabelText(/tagline/i), 'Connecting farmers to buyers')
    await userEvent.type(screen.getByLabelText(/description/i), 'A platform that helps farmers.')
    await userEvent.type(screen.getByLabelText(/website url/i), 'https://farmlink.gm')
    await userEvent.click(screen.getByRole('button', { name: /launch it/i }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: '/p/$slug' }))
    })
  })
})
