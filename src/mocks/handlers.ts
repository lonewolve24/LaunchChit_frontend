import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

const mockUser = {
  id: 'user-001',
  email: 'musa@example.com',
  name: 'Musa Jallow',
  avatar_url: null,
}

const T = {
  fintech:    { slug: 'fintech',    name: 'Fintech' },
  agritech:   { slug: 'agri-tech',  name: 'Agri-Tech' },
  edtech:     { slug: 'edtech',     name: 'EdTech' },
  healthtech: { slug: 'healthtech', name: 'HealthTech' },
  logistics:  { slug: 'logistics',  name: 'Logistics' },
  social:     { slug: 'social',     name: 'Social' },
  ecommerce:  { slug: 'ecommerce',  name: 'E-commerce' },
  govtech:    { slug: 'govtech',    name: 'Gov Tech' },
}

// Spread launch dates across the past ~5 months for the date picker
function dateOffset(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

const mockProducts = [
  { id: 'prod-001', slug: 'farmlink-gm-a3k9z2',     name: 'FarmLink GM',        tagline: 'Connecting Gambian farmers to buyers directly',           logo_url: null, vote_count: 247, has_voted: false, maker: { name: 'Musa Jallow' },      topics: [T.agritech, T.logistics],     comments_count: 38, waitlist_count: 412, created_at: dateOffset(0) },
  { id: 'prod-002', slug: 'paygam-b7x2m1',          name: 'PayGam',             tagline: 'Mobile payments built for The Gambia',                    logo_url: null, vote_count: 218, has_voted: false, maker: { name: 'Momodou Jatta' },    topics: [T.fintech, T.ecommerce],      comments_count: 52, waitlist_count: 803, created_at: dateOffset(0) },
  { id: 'prod-003', slug: 'classmate-gm-c4p8q9',    name: 'ClassMate GM',       tagline: 'School management for Gambian institutions',              logo_url: null, vote_count: 196, has_voted: false, maker: { name: 'Abdul Ikumpanyi' },  topics: [T.edtech],                    comments_count: 24, waitlist_count: 156, created_at: dateOffset(1) },
  { id: 'prod-004', slug: 'banjul-eats-d8h3k1',     name: 'Banjul Eats',        tagline: 'Order from your favourite restaurants in Banjul',          logo_url: null, vote_count: 184, has_voted: false, maker: { name: 'Fatou Ceesay' },     topics: [T.ecommerce, T.logistics],    comments_count: 31, waitlist_count: 287, created_at: dateOffset(2) },
  { id: 'prod-005', slug: 'taxi-gm-r2m9p5',         name: 'Taxi GM',            tagline: 'Hail a ride anywhere in the Greater Banjul Area',          logo_url: null, vote_count: 172, has_voted: false, maker: { name: 'Ousman Bah' },       topics: [T.logistics],                 comments_count: 47, waitlist_count: 521, created_at: dateOffset(3) },
  { id: 'prod-006', slug: 'maano-savings-q4l8n2',   name: 'Maano Savings',      tagline: 'Group savings (osusu) reimagined for mobile',              logo_url: null, vote_count: 158, has_voted: false, maker: { name: 'Aminata Touray' },   topics: [T.fintech, T.social],         comments_count: 19, waitlist_count: 234, created_at: dateOffset(5) },
  { id: 'prod-007', slug: 'kanilai-care-z6v1c7',    name: 'Kanilai Care',       tagline: 'Book a doctor or pharmacy delivery in minutes',            logo_url: null, vote_count: 145, has_voted: false, maker: { name: 'Dr Sira Sanneh' },   topics: [T.healthtech],                comments_count: 16, waitlist_count: 189, created_at: dateOffset(7) },
  { id: 'prod-008', slug: 'jollof-jobs-h7x4w8',     name: 'Jollof Jobs',        tagline: 'Find tech and creative jobs across West Africa',           logo_url: null, vote_count: 132, has_voted: false, maker: { name: 'Lamin Dibba' },      topics: [T.social],                    comments_count: 28, waitlist_count: 173, created_at: dateOffset(9) },
  { id: 'prod-009', slug: 'sankore-learn-b3y9k4',   name: 'Sankoré Learn',      tagline: 'Bilingual learning app for primary school students',       logo_url: null, vote_count: 124, has_voted: false, maker: { name: 'Ndey Suso' },        topics: [T.edtech],                    comments_count: 11, waitlist_count: 92,  created_at: dateOffset(12) },
  { id: 'prod-010', slug: 'gambia-id-p5n2k7',       name: 'Gambia ID',          tagline: 'Verify your identity for digital services in seconds',     logo_url: null, vote_count: 117, has_voted: false, maker: { name: 'Modou Saine' },      topics: [T.govtech, T.fintech],        comments_count: 22, waitlist_count: 67,  created_at: dateOffset(15) },
  { id: 'prod-011', slug: 'rice-route-t8w3m1',      name: 'RiceRoute',          tagline: 'Cooperative rice purchasing for Foni and Kombo farmers',    logo_url: null, vote_count: 109, has_voted: false, maker: { name: 'Pa Modou Faal' },    topics: [T.agritech, T.logistics],     comments_count: 9,  waitlist_count: 142, created_at: dateOffset(18) },
  { id: 'prod-012', slug: 'kasumai-chat-q9d6h3',    name: 'Kasumai Chat',       tagline: 'Group chat with built-in Wolof and Mandinka translation',  logo_url: null, vote_count: 98,  has_voted: false, maker: { name: 'Isatou Njie' },      topics: [T.social],                    comments_count: 14, waitlist_count: 78,  created_at: dateOffset(22) },
  { id: 'prod-013', slug: 'serekunda-rent-y2j5b8',  name: 'Serekunda Rent',     tagline: 'Find verified apartments and shops to rent',               logo_url: null, vote_count: 91,  has_voted: false, maker: { name: 'Babucarr Sowe' },    topics: [T.ecommerce],                 comments_count: 8,  waitlist_count: 95,  created_at: dateOffset(26) },
  { id: 'prod-014', slug: 'turntable-gm-w7c4r6',    name: 'Turntable GM',       tagline: 'Stream Gambian music made by Gambian artists',             logo_url: null, vote_count: 84,  has_voted: false, maker: { name: 'DJ Latir' },         topics: [T.social],                    comments_count: 35, waitlist_count: 58,  created_at: dateOffset(30) },
  { id: 'prod-015', slug: 'wuli-weather-m1k8s4',    name: 'Wuli Weather',       tagline: 'Hyperlocal weather and rainfall alerts for farmers',       logo_url: null, vote_count: 78,  has_voted: false, maker: { name: 'Sankung Jammeh' },   topics: [T.agritech, T.govtech],       comments_count: 6,  waitlist_count: 124, created_at: dateOffset(35) },
  { id: 'prod-016', slug: 'kombo-clinics-x3v7p2',   name: 'Kombo Clinics',      tagline: 'A directory of every clinic and pharmacy in The Gambia',   logo_url: null, vote_count: 71,  has_voted: false, maker: { name: 'Dr Awa Joof' },      topics: [T.healthtech],                comments_count: 4,  waitlist_count: 41,  created_at: dateOffset(40) },
  { id: 'prod-017', slug: 'student-fund-l4m9n5',    name: 'StudentFund',        tagline: 'Crowdfund university tuition from family and alumni',      logo_url: null, vote_count: 67,  has_voted: false, maker: { name: 'Ebrima Drammeh' },   topics: [T.edtech, T.fintech],         comments_count: 13, waitlist_count: 88,  created_at: dateOffset(46) },
  { id: 'prod-018', slug: 'cargo-gm-c6t2y8',        name: 'Cargo GM',           tagline: 'Send packages between Banjul, Brikama, and Basse',         logo_url: null, vote_count: 62,  has_voted: false, maker: { name: 'Sulayman Manneh' },  topics: [T.logistics, T.ecommerce],    comments_count: 7,  waitlist_count: 102, created_at: dateOffset(52) },
  { id: 'prod-019', slug: 'gambianect-h8b3w1',      name: 'Gambianect',         tagline: 'Professional networking for Gambians at home and abroad',  logo_url: null, vote_count: 58,  has_voted: false, maker: { name: 'Mariama Kah' },      topics: [T.social],                    comments_count: 18, waitlist_count: 36,  created_at: dateOffset(58) },
  { id: 'prod-020', slug: 'iwallet-gm-z5n7q4',      name: 'iWallet GM',         tagline: 'Multi-currency wallet for dalasi, USD and CFA',            logo_url: null, vote_count: 54,  has_voted: false, maker: { name: 'Yusupha Touray' },   topics: [T.fintech],                   comments_count: 11, waitlist_count: 167, created_at: dateOffset(65) },
  { id: 'prod-021', slug: 'school-bus-gm-r9p2k6',   name: 'SchoolBus GM',       tagline: 'Track your child\'s school bus in real time',              logo_url: null, vote_count: 49,  has_voted: false, maker: { name: 'Haddy Bah' },        topics: [T.edtech, T.logistics],       comments_count: 5,  waitlist_count: 73,  created_at: dateOffset(72) },
  { id: 'prod-022', slug: 'budget-gm-w4y6h7',       name: 'Budget GM',          tagline: 'See exactly how the national budget is spent',              logo_url: null, vote_count: 44,  has_voted: false, maker: { name: 'Saikou Camara' },    topics: [T.govtech],                   comments_count: 21, waitlist_count: 12,  created_at: dateOffset(80) },
  { id: 'prod-023', slug: 'gele-marketplace-m2k8c5',name: 'Gele Marketplace',   tagline: 'Buy and sell second-hand goods, locally',                   logo_url: null, vote_count: 41,  has_voted: false, maker: { name: 'Awa Mboge' },        topics: [T.ecommerce],                 comments_count: 9,  waitlist_count: 54,  created_at: dateOffset(88) },
  { id: 'prod-024', slug: 'fish-market-d7v3n9',     name: 'FishMarket',         tagline: 'Live fish prices from Tanji and Bakau landing sites',       logo_url: null, vote_count: 37,  has_voted: false, maker: { name: 'Pa Sait Jallow' },   topics: [T.agritech, T.ecommerce],     comments_count: 4,  waitlist_count: 31,  created_at: dateOffset(96) },
  { id: 'prod-025', slug: 'haqq-meds-q6w8b2',       name: 'HaqqMeds',           tagline: 'Pharmacy stock checker — find the medicine you need',       logo_url: null, vote_count: 33,  has_voted: false, maker: { name: 'Dr Aji Ndoye' },     topics: [T.healthtech, T.ecommerce],   comments_count: 6,  waitlist_count: 49,  created_at: dateOffset(104) },
  { id: 'prod-026', slug: 'tabaski-deals-l1n4y7',   name: 'Tabaski Deals',      tagline: 'Compare ram and goat prices across markets',                logo_url: null, vote_count: 28,  has_voted: false, maker: { name: 'Ebou Sanyang' },     topics: [T.ecommerce, T.social],       comments_count: 12, waitlist_count: 28,  created_at: dateOffset(112) },
  { id: 'prod-027', slug: 'kerr-events-h3p9k1',     name: 'Kerr Events',        tagline: 'Discover weddings, gigs, and naming ceremonies near you',  logo_url: null, vote_count: 24,  has_voted: false, maker: { name: 'Fatim Singhateh' },  topics: [T.social],                    comments_count: 7,  waitlist_count: 19,  created_at: dateOffset(120) },
  { id: 'prod-028', slug: 'tax-gm-w2y5m8',          name: 'Tax GM',             tagline: 'File your GRA tax return from your phone',                  logo_url: null, vote_count: 19,  has_voted: false, maker: { name: 'Lamin Touray' },     topics: [T.govtech, T.fintech],        comments_count: 14, waitlist_count: 22,  created_at: dateOffset(128) },
  { id: 'prod-029', slug: 'mama-care-r5b3v6',       name: 'MamaCare',           tagline: 'Pre- and post-natal care reminders by SMS',                 logo_url: null, vote_count: 15,  has_voted: false, maker: { name: 'Adama Saidy' },      topics: [T.healthtech, T.social],      comments_count: 3,  waitlist_count: 17,  created_at: dateOffset(135) },
  { id: 'prod-030', slug: 'tutor-gm-k8c2n4',        name: 'Tutor GM',           tagline: 'Book a verified tutor for WAEC and university prep',        logo_url: null, vote_count: 11,  has_voted: false, maker: { name: 'Ousainou Jagne' },   topics: [T.edtech],                    comments_count: 5,  waitlist_count: 14,  created_at: dateOffset(142) },
  { id: 'prod-031', slug: 'crop-credit-y9w4q7',     name: 'CropCredit',         tagline: 'Microloans for small-holder farmers, repaid at harvest',    logo_url: null, vote_count: 8,   has_voted: false, maker: { name: 'Binta Touray' },     topics: [T.agritech, T.fintech],       comments_count: 2,  waitlist_count: 9,   created_at: dateOffset(150) },
  { id: 'prod-032', slug: 'wolof-translate-z3m6h1', name: 'WolofTranslate',     tagline: 'Translate between English, Wolof, Mandinka and Fula',       logo_url: null, vote_count: 5,   has_voted: false, maker: { name: 'Modou Lamin Joof' }, topics: [T.edtech, T.social],          comments_count: 1,  waitlist_count: 6,   created_at: dateOffset(158) },
]

const mockTopics = [
  { id: 'topic-001', slug: 'fintech',    name: 'Fintech',     description: 'Mobile money, payments, and financial inclusion' },
  { id: 'topic-002', slug: 'agri-tech',  name: 'Agri-Tech',   description: 'Tools for Gambian farmers and agriculture' },
  { id: 'topic-003', slug: 'edtech',     name: 'EdTech',      description: 'Education technology for schools and learners' },
  { id: 'topic-004', slug: 'healthtech', name: 'HealthTech',  description: 'Healthcare and wellness products' },
  { id: 'topic-005', slug: 'logistics',  name: 'Logistics',   description: 'Delivery, transport, and supply chain' },
  { id: 'topic-006', slug: 'social',     name: 'Social',      description: 'Community and social networking' },
  { id: 'topic-007', slug: 'ecommerce',  name: 'E-commerce',  description: 'Online retail and marketplaces' },
  { id: 'topic-008', slug: 'govtech',    name: 'Gov Tech',    description: 'Civic and government technology' },
]

function topicProductCount(topicSlug: string) {
  return mockProducts.filter((p) => p.topics?.some((t) => t.slug === topicSlug)).length
}

const mockProfile = {
  id: 'user-001',
  username: 'musa-jallow',
  name: 'Musa Jallow',
  bio: 'Building products for The Gambia. Founder of FarmLink GM.',
  avatar_url: null,
  website: 'https://musajallow.com',
  products: mockProducts.filter((p) => p.maker.name === 'Musa Jallow'),
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

  // GET /products/today  — supports ?month=YYYY-MM&page=&page_size=
  http.get(`${BASE}/products/today`, ({ request }) => {
    const url = new URL(request.url)
    const month = url.searchParams.get('month') // YYYY-MM
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
    const pageSize = Math.max(1, Number(url.searchParams.get('page_size') ?? '25'))

    let filtered = [...products]
    if (month) {
      filtered = filtered.filter((p) => p.created_at.slice(0, 7) === month)
    }
    filtered.sort((a, b) => {
      // newer first, then by votes desc as a tiebreak
      const t = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return t !== 0 ? t : b.vote_count - a.vote_count
    })

    const total = filtered.length
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    return HttpResponse.json({ items, total, page, page_size: pageSize })
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

    // Build a "rank" based on vote position
    const ranked = [...products].sort((a, b) => b.vote_count - a.vote_count)
    const dayRank = ranked.findIndex((p) => p.id === product.id) + 1

    // Find similar products (overlapping topic), up to 4
    const productTopicSlugs = new Set((product.topics ?? []).map((t) => t.slug))
    const similar = products
      .filter((p) => p.id !== product.id && p.topics?.some((t) => productTopicSlugs.has(t.slug)))
      .slice(0, 4)

    return HttpResponse.json({
      ...product,
      description: `${product.tagline}.\n\n${product.name} was built to solve a specific problem for the Gambian market. After months of working with users in Banjul, Brikama, and the rural Kombo areas, the team shipped a first version that focuses on three things: simplicity, offline reliability, and a price point that works for the market.\n\nThe team is small but committed — every feature you see has been requested by at least three real users. There's no growth-hacking, no fake testimonials, no "AI-powered" buzzwords thrown in for fundraising. Just a tool that works.\n\nWhat's next: we're rolling out support for additional regions, integrating with local payment providers, and (in beta) a partnership with two ministries to scale distribution.`,
      website_url: `https://${product.slug.replace(/-/g, '')}.gm`,
      pricing: 'Free during beta · Paid plans from D200/month',
      platforms: ['Web', 'Android', 'iOS'],
      launch_date: '2026-04-26',
      day_rank: dayRank,
      maker: { id: 'user-001', name: product.maker.name, avatar_url: null, bio: `Building ${product.name} and other tools for The Gambia.` },
      topics: product.topics ?? [],
      gallery: [
        { color: '#1B4332', label: 'Dashboard' },
        { color: '#2563EB', label: 'Onboarding flow' },
        { color: '#7C5CBF', label: 'Mobile app' },
        { color: '#DC4A22', label: 'Reports view' },
        { color: '#0891B2', label: 'Settings panel' },
      ],
      team: [
        { name: product.maker.name, role: 'Founder · CEO', avatar_color: '#1B4332', bio: 'Shipping for The Gambia' },
        { name: 'Awa Touray', role: 'Engineering Lead', avatar_color: '#7C5CBF', bio: 'Builds backend systems' },
        { name: 'Lamin Saho', role: 'Product Designer', avatar_color: '#2563EB', bio: 'Obsessed with details' },
        { name: 'Binta Ceesay', role: 'Community', avatar_color: '#DC4A22', bio: 'Talks to every user' },
      ],
      built_with: [
        { name: 'Africa\'s Talking', description: 'SMS, USSD and voice APIs for African markets', icon_color: '#DC4A22' },
        { name: 'Wave', description: 'Mobile money payments across West Africa', icon_color: '#2563EB' },
        { name: 'Supabase', description: 'Open-source Postgres backend', icon_color: '#065F46' },
        { name: 'Mapbox', description: 'Maps for the Greater Banjul region', icon_color: '#0891B2' },
      ],
      ratings: { average: 4.4, total: 27, breakdown: { 5: 18, 4: 5, 3: 2, 2: 1, 1: 1 } },
      reviews: [
        {
          id: 'r1',
          author: { name: 'Fatou Ceesay' },
          rating: 5,
          headline: 'Genuinely useful',
          body: `I've been using ${product.name} for a month. It just works — even when my data drops to 2G in Brikama. The team actually responds to feedback, which is rare.`,
          created_at: '3 days ago',
          helpful: 14,
        },
        {
          id: 'r2',
          author: { name: 'Modou Saine' },
          rating: 4,
          headline: 'Solid product, missing a few things',
          body: 'Core experience is great. Would love a desktop version and Wolof support. The team has confirmed both are on the roadmap, so 4 stars instead of 5 for now.',
          created_at: '1 week ago',
          helpful: 8,
        },
        {
          id: 'r3',
          author: { name: 'Aminata Touray' },
          rating: 5,
          headline: 'Recommended to my whole team',
          body: 'We rolled this out across our co-op last week. Onboarding took less than an hour. Worth every dalasi.',
          created_at: '2 weeks ago',
          helpful: 6,
        },
      ],
      similar_products: similar.map((p) => ({ id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, vote_count: p.vote_count })),
      stats: { followers: Math.round(product.vote_count * 4.2), reviews: Math.max(2, Math.round(product.vote_count / 6)) },
      comments: [
        {
          id: 'c1',
          author: { name: product.maker.name, role: 'Maker' },
          body: `Hey LaunchedChit 👋 — ${product.maker.name} here, founder of ${product.name}. Excited to launch today! Happy to answer any questions about how we built this and what's next on the roadmap.`,
          created_at: '2 hours ago',
          upvotes: 12,
          replies: [
            {
              id: 'c1r1',
              author: { name: 'Fatou Ceesay' },
              body: 'Congrats on the launch! How long did it take you to go from idea to MVP?',
              created_at: '1 hour ago',
              upvotes: 3,
            },
          ],
        },
        {
          id: 'c2',
          author: { name: 'Ousman Bah' },
          body: 'Tried this last week — really clean experience. The offline mode is what sold me. So many products break the moment your network drops, and yours just kept working. Bookmarked.',
          created_at: '4 hours ago',
          upvotes: 8,
          replies: [],
        },
        {
          id: 'c3',
          author: { name: 'Aminata Touray' },
          body: 'This is exactly what the market needed. Sent it to two NGOs I work with. Quick question — do you have a Wolof interface planned?',
          created_at: '5 hours ago',
          upvotes: 6,
          replies: [
            {
              id: 'c3r1',
              author: { name: product.maker.name, role: 'Maker' },
              body: '@aminata Wolof is on the roadmap for Q3, alongside Mandinka and Pulaar. We\'re partnering with the Wolof Translate team for that work.',
              created_at: '4 hours ago',
              upvotes: 5,
            },
          ],
        },
      ],
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
    return HttpResponse.json(mockTopics.map((t) => ({ ...t, product_count: topicProductCount(t.slug) })))
  }),

  // GET /topics/:slug — MUST be before /topics/:slug/products
  http.get(`${BASE}/topics/:slug`, ({ params }) => {
    const topic = mockTopics.find((t) => t.slug === params.slug)
    if (!topic) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ ...topic, product_count: topicProductCount(topic.slug) })
  }),

  // GET /topics/:slug/products
  http.get(`${BASE}/topics/:slug/products`, ({ params }) => {
    const topic = mockTopics.find((t) => t.slug === params.slug)
    if (!topic) return new HttpResponse(null, { status: 404 })
    const filtered = products.filter((p) => p.topics?.some((t) => t.slug === topic.slug))
    return HttpResponse.json([...filtered].sort((a, b) => b.vote_count - a.vote_count))
  }),

  // GET /profile/:username
  http.get(`${BASE}/profile/:username`, ({ params }) => {
    if (params.username === mockProfile.username) return HttpResponse.json(mockProfile)
    return new HttpResponse(null, { status: 404 })
  }),
]
