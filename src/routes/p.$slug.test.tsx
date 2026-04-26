import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ProductDetailPage } from './p.$slug'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useParams: () => ({ slug: 'farmlink-gm-a3k9z2' }),
    createFileRoute: actual.createFileRoute,
  }
})

describe('ProductDetailPage', () => {
  it('renders product name', async () => {
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /farmlink gm/i })).toBeInTheDocument())
  })

  it('renders product tagline', async () => {
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByText(/connecting gambian farmers/i)).toBeInTheDocument())
  })

  it('renders product description', async () => {
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByText(/a detailed description/i)).toBeInTheDocument())
  })

  it('renders a Visit website link', async () => {
    render(<ProductDetailPage />)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /visit website/i })
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  it('renders the maker name', async () => {
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByText(/musa jallow/i)).toBeInTheDocument())
  })

  it('renders the upvote button with vote count', async () => {
    render(<ProductDetailPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upvote/i })).toBeInTheDocument()
    })
  })

  it('shows PageError 404 when slug is not found', async () => {
    const { server } = await import('../mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(http.get('http://localhost:8000/products/:slug', () => new HttpResponse(null, { status: 404 })))
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument())
  })

  it('shows skeleton while loading', () => {
    render(<ProductDetailPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
