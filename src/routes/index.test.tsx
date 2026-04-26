import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { FeedPage } from './index'

describe('FeedPage', () => {
  it('shows skeleton cards while loading', () => {
    render(<FeedPage />)
    expect(document.querySelectorAll('[role="presentation"]').length).toBeGreaterThan(0)
  })

  it('renders product cards after data loads', async () => {
    render(<FeedPage />)
    await waitFor(() => {
      expect(screen.getByText('FarmLink GM')).toBeInTheDocument()
      expect(screen.getByText('PayGam')).toBeInTheDocument()
    })
  })

  it('renders products ordered by vote count descending', async () => {
    render(<FeedPage />)
    await waitFor(() => {
      const names = screen.getAllByRole('link', { name: /farmlink gm|paygam|classmate gm/i })
      expect(names[0]).toHaveTextContent('FarmLink GM')
    })
  })

  it('shows empty state when no products are returned', async () => {
    const { server } = await import('../mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.get('http://localhost:8000/products/today', () => HttpResponse.json([]))
    )
    render(<FeedPage />)
    await waitFor(() => {
      expect(screen.getByText(/no launches today/i)).toBeInTheDocument()
    })
  })

  it('renders the page heading', async () => {
    render(<FeedPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /today's launches/i })).toBeInTheDocument()
    })
  })
})
