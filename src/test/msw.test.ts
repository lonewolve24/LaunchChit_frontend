import { describe, it, expect } from 'vitest'

const BASE = 'http://localhost:8000'

describe('MSW handlers', () => {
  it('GET /products/today returns a list of products', async () => {
    const res = await fetch(`${BASE}/products/today`)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    expect(data[0]).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
      tagline: expect.any(String),
      vote_count: expect.any(Number),
      has_voted: expect.any(Boolean),
    })
  })

  it('GET /me returns 401 when not logged in', async () => {
    const res = await fetch(`${BASE}/me`)
    expect(res.status).toBe(401)
  })

  it('POST /auth/magic-link returns 204', async () => {
    const res = await fetch(`${BASE}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    })
    expect(res.status).toBe(204)
  })
})
