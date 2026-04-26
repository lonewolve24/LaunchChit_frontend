import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

const mockUser = {
  id: 'user-001',
  email: 'musa@example.com',
  name: 'Musa Jallow',
  avatar_url: null,
}

const mockProducts = [
  {
    id: 'prod-001',
    slug: 'farmlink-gm-a3k9z2',
    name: 'FarmLink GM',
    tagline: 'Connecting Gambian farmers to buyers directly',
    logo_url: null,
    vote_count: 24,
    has_voted: false,
    maker: { name: 'Musa Jallow' },
    topics: [{ slug: 'agri-tech', name: 'Agri-Tech' }, { slug: 'logistics', name: 'Logistics' }],
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    slug: 'paygam-b7x2m1',
    name: 'PayGam',
    tagline: 'Mobile payments built for The Gambia',
    logo_url: null,
    vote_count: 18,
    has_voted: false,
    maker: { name: 'Momodou Jatta' },
    topics: [{ slug: 'fintech', name: 'Fintech' }, { slug: 'ecommerce', name: 'E-commerce' }],
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    slug: 'classmate-gm-c4p8q9',
    name: 'ClassMate GM',
    tagline: 'School management for Gambian institutions',
    logo_url: null,
    vote_count: 11,
    has_voted: false,
    maker: { name: 'Abdul Ikumpanyi' },
    topics: [{ slug: 'edtech', name: 'EdTech' }],
    created_at: new Date().toISOString(),
  },
]

const mockTopics = [
  { id: 'topic-001', slug: 'fintech', name: 'Fintech', description: 'Mobile money, payments, and financial inclusion', product_count: 4 },
  { id: 'topic-002', slug: 'agri-tech', name: 'Agri-Tech', description: 'Tools for Gambian farmers and agriculture', product_count: 3 },
  { id: 'topic-003', slug: 'edtech', name: 'EdTech', description: 'Education technology for schools and learners', product_count: 2 },
  { id: 'topic-004', slug: 'healthtech', name: 'HealthTech', description: 'Healthcare and wellness products', product_count: 1 },
  { id: 'topic-005', slug: 'logistics', name: 'Logistics', description: 'Delivery, transport, and supply chain', product_count: 2 },
  { id: 'topic-006', slug: 'social', name: 'Social', description: 'Community and social networking', product_count: 1 },
  { id: 'topic-007', slug: 'ecommerce', name: 'E-commerce', description: 'Online retail and marketplaces', product_count: 3 },
  { id: 'topic-008', slug: 'govtech', name: 'Gov Tech', description: 'Civic and government technology', product_count: 1 },
]

const mockProfile = {
  id: 'user-001',
  username: 'musa-jallow',
  name: 'Musa Jallow',
  bio: 'Building products for The Gambia. Founder of FarmLink GM.',
  avatar_url: null,
  website: 'https://musajallow.com',
  products: mockProducts,
}

let products = [...mockProducts]
let votes = new Set<string>()
let sessionActive = false

export const handlers = [
  // POST /auth/magic-link
  http.post(`${BASE}/auth/magic-link`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /auth/callback
  http.get(`${BASE}/auth/callback`, () => {
    sessionActive = true
    return HttpResponse.redirect('http://localhost:3000/', 302)
  }),

  // POST /auth/logout
  http.post(`${BASE}/auth/logout`, () => {
    sessionActive = false
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /me
  http.get(`${BASE}/me`, () => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json(mockUser)
  }),

  // PATCH /me
  http.patch(`${BASE}/me`, async ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as Record<string, string>
    if (body.name) mockUser.name = body.name
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /products/today
  http.get(`${BASE}/products/today`, () => {
    const feed = [...products].sort((a, b) => b.vote_count - a.vote_count)
    return HttpResponse.json(feed)
  }),

  // GET /products/leaderboard — MUST be before /products/:slug
  http.get(`${BASE}/products/leaderboard`, () => {
    const ranked = [...products].sort((a, b) => b.vote_count - a.vote_count)
    return HttpResponse.json(ranked)
  }),

  // GET /products/archive — MUST be before /products/:slug
  http.get(`${BASE}/products/archive`, () => {
    const archived = [...products].sort((a, b) => b.vote_count - a.vote_count)
    return HttpResponse.json(archived)
  }),

  // GET /products/:slug
  http.get(`${BASE}/products/:slug`, ({ params }) => {
    const product = products.find((p) => p.slug === params.slug)
    if (!product) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({
      ...product,
      description: 'A detailed description of this product goes here.',
      website_url: 'https://example.com',
      maker: { id: 'user-001', name: 'Musa Jallow', avatar_url: null },
      topics: product.topics ?? [],
    })
  }),

  // POST /products
  http.post(`${BASE}/products`, async ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as Record<string, string>
    const slug = `${body.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`
    const newProduct = {
      id: `prod-${Date.now()}`,
      slug,
      name: body.name,
      tagline: body.tagline,
      logo_url: body.logo_url ?? null,
      vote_count: 0,
      has_voted: false,
      maker: { name: mockUser.name },
      created_at: new Date().toISOString(),
    }
    products = [newProduct, ...products]
    return HttpResponse.json({ slug }, { status: 201 })
  }),

  // POST /products/:id/vote
  http.post(`${BASE}/products/:id/vote`, ({ params }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const key = `${mockUser.id}:${params.id}`
    if (votes.has(key)) return new HttpResponse(null, { status: 409 })
    votes.add(key)
    const product = products.find((p) => p.id === params.id)
    if (!product) return new HttpResponse(null, { status: 404 })
    product.vote_count += 1
    product.has_voted = true
    return HttpResponse.json({ vote_count: product.vote_count })
  }),

  // DELETE /products/:id/vote
  http.delete(`${BASE}/products/:id/vote`, ({ params }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const key = `${mockUser.id}:${params.id}`
    if (!votes.has(key)) return new HttpResponse(null, { status: 404 })
    votes.delete(key)
    const product = products.find((p) => p.id === params.id)
    if (!product) return new HttpResponse(null, { status: 404 })
    product.vote_count -= 1
    product.has_voted = false
    return HttpResponse.json({ vote_count: product.vote_count })
  }),

  // GET /topics
  http.get(`${BASE}/topics`, () => {
    return HttpResponse.json(mockTopics)
  }),

  // GET /topics/:slug — MUST be before /topics/:slug/products
  http.get(`${BASE}/topics/:slug`, ({ params }) => {
    const topic = mockTopics.find((t) => t.slug === params.slug)
    if (!topic) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(topic)
  }),

  // GET /topics/:slug/products
  http.get(`${BASE}/topics/:slug/products`, ({ params }) => {
    const topic = mockTopics.find((t) => t.slug === params.slug)
    if (!topic) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json([...products].sort((a, b) => b.vote_count - a.vote_count))
  }),

  // GET /profile/:username
  http.get(`${BASE}/profile/:username`, ({ params }) => {
    if (params.username === mockProfile.username) return HttpResponse.json(mockProfile)
    return new HttpResponse(null, { status: 404 })
  }),
]
