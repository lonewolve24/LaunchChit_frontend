import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

const mockUser = {
  id: 'user-001',
  email: 'musa@example.com',
  name: 'Musa Jallow',
  avatar_url: null,
}

const mockAdmin = {
  id: 'admin-001',
  email: 'admin@launchedchit.gm',
  name: 'Admin',
  role: 'super-admin' as const,
  mfa_enrolled: false,
}

/*
  Admin session — kept on its own key so that maker login and admin
  login don't trample each other (you can be both, and an admin
  shouldn't get auto-elevated just by hitting /login).
  Two-stage state: 'idle' before login, 'mfa-required' after password,
  fully active once MFA is verified.
*/
const ADMIN_SESSION_KEY = 'launchedchit:mock-admin-session'
let adminSessionActive: boolean = (() => {
  if (typeof window === 'undefined') return false
  try { return window.localStorage?.getItem(ADMIN_SESSION_KEY) === '1' } catch { return false }
})()
let adminSessionStage: 'idle' | 'mfa-required' = adminSessionActive ? 'idle' : 'idle'
function setAdminSessionActive(on: boolean) {
  adminSessionActive = on
  if (typeof window !== 'undefined') {
    try {
      if (on) window.localStorage?.setItem(ADMIN_SESSION_KEY, '1')
      else window.localStorage?.removeItem(ADMIN_SESSION_KEY)
    } catch { /* ignore quota errors */ }
  }
  if (on) adminSessionStage = 'idle'
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

// Deterministic license assignment from slug; ~1 in 3 products are open-source
function productLicense(slug: string): 'open-source' | 'commercial' {
  const sum = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return sum % 3 === 0 ? 'open-source' : 'commercial'
}

function withLicense<T extends { license?: string; slug: string }>(p: T) {
  return { ...p, license: p.license ?? productLicense(p.slug) }
}

const mockProducts = [
  { id: 'prod-001', slug: 'farmlink-gm-a3k9z2',     name: 'FarmLink GM',        tagline: 'Connecting Gambian farmers to buyers directly',           logo_url: null, vote_count: 247, has_voted: false, maker: { name: 'Musa Jallow' },      topics: [T.agritech, T.logistics],     comments_count: 38, waitlist_count: 412, platforms: ['web', 'mobile'], license: 'open-source', created_at: dateOffset(0) },
  { id: 'prod-002', slug: 'paygam-b7x2m1',          name: 'PayGam',             tagline: 'Mobile payments built for The Gambia',                    logo_url: null, vote_count: 218, has_voted: false, maker: { name: 'Momodou Jatta' },    topics: [T.fintech, T.ecommerce],      comments_count: 52, waitlist_count: 803, platforms: ['mobile'], license: 'commercial', created_at: dateOffset(0) },
  { id: 'prod-003', slug: 'classmate-gm-c4p8q9',    name: 'ClassMate GM',       tagline: 'School management for Gambian institutions',              logo_url: null, vote_count: 196, has_voted: false, maker: { name: 'Abdul Ikumpanyi' },  topics: [T.edtech],                    comments_count: 24, waitlist_count: 156, platforms: ['web', 'desktop'],          created_at: dateOffset(1) },
  { id: 'prod-004', slug: 'banjul-eats-d8h3k1',     name: 'Banjul Eats',        tagline: 'Order from your favourite restaurants in Banjul',          logo_url: null, vote_count: 184, has_voted: false, maker: { name: 'Fatou Ceesay' },     topics: [T.ecommerce, T.logistics],    comments_count: 31, waitlist_count: 287, platforms: ['web', 'mobile'],            created_at: dateOffset(2) },
  { id: 'prod-005', slug: 'taxi-gm-r2m9p5',         name: 'Taxi GM',            tagline: 'Hail a ride anywhere in the Greater Banjul Area',          logo_url: null, vote_count: 172, has_voted: false, maker: { name: 'Ousman Bah' },       topics: [T.logistics],                 comments_count: 47, waitlist_count: 521, platforms: ['mobile'],                   created_at: dateOffset(3) },
  { id: 'prod-006', slug: 'maano-savings-q4l8n2',   name: 'Maano Savings',      tagline: 'Group savings (osusu) reimagined for mobile',              logo_url: null, vote_count: 158, has_voted: false, maker: { name: 'Aminata Touray' },   topics: [T.fintech, T.social],         comments_count: 19, waitlist_count: 234, platforms: ['mobile'],                   created_at: dateOffset(5) },
  { id: 'prod-007', slug: 'kanilai-care-z6v1c7',    name: 'Kanilai Care',       tagline: 'Book a doctor or pharmacy delivery in minutes',            logo_url: null, vote_count: 145, has_voted: false, maker: { name: 'Dr Sira Sanneh' },   topics: [T.healthtech],                comments_count: 16, waitlist_count: 189, platforms: ['web', 'mobile'],            created_at: dateOffset(7) },
  { id: 'prod-008', slug: 'jollof-jobs-h7x4w8',     name: 'Jollof Jobs',        tagline: 'Find tech and creative jobs across West Africa',           logo_url: null, vote_count: 132, has_voted: false, maker: { name: 'Lamin Dibba' },      topics: [T.social],                    comments_count: 28, waitlist_count: 173, platforms: ['web'],                      created_at: dateOffset(9) },
  { id: 'prod-009', slug: 'sankore-learn-b3y9k4',   name: 'Sankoré Learn',      tagline: 'Bilingual learning app for primary school students',       logo_url: null, vote_count: 124, has_voted: false, maker: { name: 'Ndey Suso' },        topics: [T.edtech],                    comments_count: 11, waitlist_count: 92,  platforms: ['mobile', 'desktop'],        created_at: dateOffset(12) },
  { id: 'prod-010', slug: 'gambia-id-p5n2k7',       name: 'Gambia ID',          tagline: 'Verify your identity for digital services in seconds',     logo_url: null, vote_count: 117, has_voted: false, maker: { name: 'Modou Saine' },      topics: [T.govtech, T.fintech],        comments_count: 22, waitlist_count: 67,  platforms: ['web', 'mobile'],            created_at: dateOffset(15) },
  { id: 'prod-011', slug: 'rice-route-t8w3m1',      name: 'RiceRoute',          tagline: 'Cooperative rice purchasing for Foni and Kombo farmers',    logo_url: null, vote_count: 109, has_voted: false, maker: { name: 'Pa Modou Faal' },    topics: [T.agritech, T.logistics],     comments_count: 9,  waitlist_count: 142, platforms: ['web'],                      created_at: dateOffset(18) },
  { id: 'prod-012', slug: 'kasumai-chat-q9d6h3',    name: 'Kasumai Chat',       tagline: 'Group chat with built-in Wolof and Mandinka translation',  logo_url: null, vote_count: 98,  has_voted: false, maker: { name: 'Isatou Njie' },      topics: [T.social],                    comments_count: 14, waitlist_count: 78,  platforms: ['web', 'mobile', 'desktop'], created_at: dateOffset(22) },
  { id: 'prod-013', slug: 'serekunda-rent-y2j5b8',  name: 'Serekunda Rent',     tagline: 'Find verified apartments and shops to rent',               logo_url: null, vote_count: 91,  has_voted: false, maker: { name: 'Babucarr Sowe' },    topics: [T.ecommerce],                 comments_count: 8,  waitlist_count: 95,  platforms: ['web'],                      created_at: dateOffset(26) },
  { id: 'prod-014', slug: 'turntable-gm-w7c4r6',    name: 'Turntable GM',       tagline: 'Stream Gambian music made by Gambian artists',             logo_url: null, vote_count: 84,  has_voted: false, maker: { name: 'DJ Latir' },         topics: [T.social],                    comments_count: 35, waitlist_count: 58,  platforms: ['web', 'mobile'],            created_at: dateOffset(30) },
  { id: 'prod-015', slug: 'wuli-weather-m1k8s4',    name: 'Wuli Weather',       tagline: 'Hyperlocal weather and rainfall alerts for farmers',       logo_url: null, vote_count: 78,  has_voted: false, maker: { name: 'Sankung Jammeh' },   topics: [T.agritech, T.govtech],       comments_count: 6,  waitlist_count: 124, platforms: ['mobile'],                   created_at: dateOffset(35) },
  { id: 'prod-016', slug: 'kombo-clinics-x3v7p2',   name: 'Kombo Clinics',      tagline: 'A directory of every clinic and pharmacy in The Gambia',   logo_url: null, vote_count: 71,  has_voted: false, maker: { name: 'Dr Awa Joof' },      topics: [T.healthtech],                comments_count: 4,  waitlist_count: 41,  platforms: ['web'],                      created_at: dateOffset(40) },
  { id: 'prod-017', slug: 'student-fund-l4m9n5',    name: 'StudentFund',        tagline: 'Crowdfund university tuition from family and alumni',      logo_url: null, vote_count: 67,  has_voted: false, maker: { name: 'Ebrima Drammeh' },   topics: [T.edtech, T.fintech],         comments_count: 13, waitlist_count: 88,  platforms: ['web', 'mobile'],            created_at: dateOffset(46) },
  { id: 'prod-018', slug: 'cargo-gm-c6t2y8',        name: 'Cargo GM',           tagline: 'Send packages between Banjul, Brikama, and Basse',         logo_url: null, vote_count: 62,  has_voted: false, maker: { name: 'Sulayman Manneh' },  topics: [T.logistics, T.ecommerce],    comments_count: 7,  waitlist_count: 102, platforms: ['mobile'],                   created_at: dateOffset(52) },
  { id: 'prod-019', slug: 'gambianect-h8b3w1',      name: 'Gambianect',         tagline: 'Professional networking for Gambians at home and abroad',  logo_url: null, vote_count: 58,  has_voted: false, maker: { name: 'Mariama Kah' },      topics: [T.social],                    comments_count: 18, waitlist_count: 36,  platforms: ['web', 'mobile'],            created_at: dateOffset(58) },
  { id: 'prod-020', slug: 'iwallet-gm-z5n7q4',      name: 'iWallet GM',         tagline: 'Multi-currency wallet for dalasi, USD and CFA',            logo_url: null, vote_count: 54,  has_voted: false, maker: { name: 'Yusupha Touray' },   topics: [T.fintech],                   comments_count: 11, waitlist_count: 167, platforms: ['mobile'],                   created_at: dateOffset(65) },
  { id: 'prod-021', slug: 'school-bus-gm-r9p2k6',   name: 'SchoolBus GM',       tagline: 'Track your child\'s school bus in real time',              logo_url: null, vote_count: 49,  has_voted: false, maker: { name: 'Haddy Bah' },        topics: [T.edtech, T.logistics],       comments_count: 5,  waitlist_count: 73,  platforms: ['mobile'],                   created_at: dateOffset(72) },
  { id: 'prod-022', slug: 'budget-gm-w4y6h7',       name: 'Budget GM',          tagline: 'See exactly how the national budget is spent',              logo_url: null, vote_count: 44,  has_voted: false, maker: { name: 'Saikou Camara' },    topics: [T.govtech],                   comments_count: 21, waitlist_count: 12,  platforms: ['web'],                      created_at: dateOffset(80) },
  { id: 'prod-023', slug: 'gele-marketplace-m2k8c5',name: 'Gele Marketplace',   tagline: 'Buy and sell second-hand goods, locally',                   logo_url: null, vote_count: 41,  has_voted: false, maker: { name: 'Awa Mboge' },        topics: [T.ecommerce],                 comments_count: 9,  waitlist_count: 54,  platforms: ['web', 'mobile'],            created_at: dateOffset(88) },
  { id: 'prod-024', slug: 'fish-market-d7v3n9',     name: 'FishMarket',         tagline: 'Live fish prices from Tanji and Bakau landing sites',       logo_url: null, vote_count: 37,  has_voted: false, maker: { name: 'Pa Sait Jallow' },   topics: [T.agritech, T.ecommerce],     comments_count: 4,  waitlist_count: 31,  platforms: ['web'],                      created_at: dateOffset(96) },
  { id: 'prod-025', slug: 'haqq-meds-q6w8b2',       name: 'HaqqMeds',           tagline: 'Pharmacy stock checker — find the medicine you need',       logo_url: null, vote_count: 33,  has_voted: false, maker: { name: 'Dr Aji Ndoye' },     topics: [T.healthtech, T.ecommerce],   comments_count: 6,  waitlist_count: 49,  platforms: ['web', 'mobile'],            created_at: dateOffset(104) },
  { id: 'prod-026', slug: 'tabaski-deals-l1n4y7',   name: 'Tabaski Deals',      tagline: 'Compare ram and goat prices across markets',                logo_url: null, vote_count: 28,  has_voted: false, maker: { name: 'Ebou Sanyang' },     topics: [T.ecommerce, T.social],       comments_count: 12, waitlist_count: 28,  platforms: ['mobile'],                   created_at: dateOffset(112) },
  { id: 'prod-027', slug: 'kerr-events-h3p9k1',     name: 'Kerr Events',        tagline: 'Discover weddings, gigs, and naming ceremonies near you',  logo_url: null, vote_count: 24,  has_voted: false, maker: { name: 'Fatim Singhateh' },  topics: [T.social],                    comments_count: 7,  waitlist_count: 19,  platforms: ['mobile'],                   created_at: dateOffset(120) },
  { id: 'prod-028', slug: 'tax-gm-w2y5m8',          name: 'Tax GM',             tagline: 'File your GRA tax return from your phone',                  logo_url: null, vote_count: 19,  has_voted: false, maker: { name: 'Lamin Touray' },     topics: [T.govtech, T.fintech],        comments_count: 14, waitlist_count: 22,  platforms: ['web', 'mobile'],            created_at: dateOffset(128) },
  { id: 'prod-029', slug: 'mama-care-r5b3v6',       name: 'MamaCare',           tagline: 'Pre- and post-natal care reminders by SMS',                 logo_url: null, vote_count: 15,  has_voted: false, maker: { name: 'Adama Saidy' },      topics: [T.healthtech, T.social],      comments_count: 3,  waitlist_count: 17,  platforms: ['mobile'],                   created_at: dateOffset(135) },
  { id: 'prod-030', slug: 'tutor-gm-k8c2n4',        name: 'Tutor GM',           tagline: 'Book a verified tutor for WAEC and university prep',        logo_url: null, vote_count: 11,  has_voted: false, maker: { name: 'Ousainou Jagne' },   topics: [T.edtech],                    comments_count: 5,  waitlist_count: 14,  platforms: ['web', 'mobile'],            created_at: dateOffset(142) },
  { id: 'prod-031', slug: 'crop-credit-y9w4q7',     name: 'CropCredit',         tagline: 'Microloans for small-holder farmers, repaid at harvest',    logo_url: null, vote_count: 8,   has_voted: false, maker: { name: 'Binta Touray' },     topics: [T.agritech, T.fintech],       comments_count: 2,  waitlist_count: 9,   platforms: ['mobile'],                   created_at: dateOffset(150) },
  { id: 'prod-032', slug: 'wolof-translate-z3m6h1', name: 'WolofTranslate',     tagline: 'Translate between English, Wolof, Mandinka and Fula',       logo_url: null, vote_count: 5,   has_voted: false, maker: { name: 'Modou Lamin Joof' }, topics: [T.edtech, T.social],          comments_count: 1,  waitlist_count: 6,   platforms: ['web', 'mobile', 'desktop'], created_at: dateOffset(158) },
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

const mockForumCategories = [
  { slug: 'general',       name: 'General',       description: 'Anything related to building in The Gambia',  icon_color: '#1B4332' },
  { slug: 'show-and-tell', name: 'Show & Tell',   description: 'Share what you\'re working on, get feedback', icon_color: '#7C5CBF' },
  { slug: 'help',          name: 'Help',          description: 'Get unstuck on a technical or business problem', icon_color: '#2563EB' },
  { slug: 'feedback',      name: 'Feedback',      description: 'Reviews of your product, landing page, or copy', icon_color: '#DC4A22' },
  { slug: 'jobs',          name: 'Jobs & Hiring', description: 'Hire builders or find work',                  icon_color: '#0891B2' },
  { slug: 'off-topic',     name: 'Off Topic',     description: 'Memes, news, life — everything else',         icon_color: '#B45309' },
]

type ThreadReply = { id: string; author: { name: string }; body: string; created_at: string; upvotes: number }
type Thread = {
  id: string
  category: string
  product_slug: string | null
  title: string
  body_preview: string
  body: string
  author: { name: string; bio?: string }
  replies: number
  upvotes: number
  last_reply_at: string
  pinned: boolean
  follower_count: number
  reply_list: ThreadReply[]
}

function makeReplies(authors: string[]): ThreadReply[] {
  const samples = [
    'Great question. I\'ve been thinking about this too — the network effects in The Gambia favour whoever ships first.',
    'Have you tried partnering with a local NGO? They tend to have distribution already.',
    'Counterpoint: building for the diaspora first might unlock more capital. Once you have revenue, the local play gets easier.',
    'Echoing the others — focus on one cohort, win it, then expand.',
    'I went through this same loop last year. Happy to share what worked / didn\'t. DM me.',
    'The thing nobody mentions: customer support is the bottleneck. Building is the easy part.',
  ]
  return authors.map((name, i) => ({
    id: `r${i + 1}`,
    author: { name },
    body: samples[i % samples.length],
    created_at: `${i + 1}h ago`,
    upvotes: 12 - i,
  }))
}

const mockThreads: Thread[] = [
  { id: 't1',  category: 'general',       product_slug: null,                     title: 'What is the biggest blocker for Gambian startups in 2026?',                          body_preview: 'I keep hearing the same three things — payments, distribution, talent…',  body: 'I keep hearing the same three things from every founder I talk to: payments are unreliable, distribution is hard, and talent is hard to find / retain.\n\nIs that everyone\'s experience? What would unlock the next 10x of activity for our ecosystem?', author: { name: 'Musa Jallow', bio: 'Founder at FarmLink GM' }, replies: 47, upvotes: 124, last_reply_at: '2 hours ago',  pinned: true,  follower_count: 89, reply_list: makeReplies(['Momodou Jatta', 'Aminata Touray', 'Yusupha Touray', 'Fatim Singhateh']) },
  { id: 't2',  category: 'show-and-tell', product_slug: 'paygam-b7x2m1',          title: 'PayGam — we hit 10,000 transactions yesterday 🎉',                                  body_preview: 'Took us 8 months and 14 rewrites of the QR flow. Here\'s what we learned…', body: 'Took us 8 months and 14 rewrites of the QR flow.\n\nWhat worked:\n• Going to the market and watching people fail to use the app, on repeat\n• Removing 4 of the 6 fields in the signup\n• Adding USSD as a fallback\n\nWhat didn\'t:\n• Cold outreach (~0.5% conversion)\n• Paid Facebook ads (CAC made no sense)\n\nHappy to answer questions.', author: { name: 'Momodou Jatta', bio: 'Co-founder at PayGam' }, replies: 32, upvotes: 98,  last_reply_at: '4 hours ago',  pinned: false, follower_count: 54, reply_list: makeReplies(['Lamin Touray', 'Babucarr Sowe', 'Awa Mboge']) },
  { id: 't3',  category: 'help',          product_slug: null,                     title: 'How are people handling KYC for fintech apps in The Gambia?',                       body_preview: 'Looking for recommendations. We\'ve been using Smile Identity but it\'s expensive…', body: 'We\'ve been using Smile Identity for ID verification but the per-call cost is killing our unit economics.\n\nIs there a cheaper provider that works reliably with Gambian national IDs and passports? Open to building something in-house if the volume justifies it.', author: { name: 'Yusupha Touray', bio: 'iWallet GM' }, replies: 19, upvotes: 67,  last_reply_at: '6 hours ago',  pinned: false, follower_count: 41, reply_list: makeReplies(['Modou Saine', 'Lamin Touray']) },
  { id: 't4',  category: 'feedback',      product_slug: 'farmlink-gm-a3k9z2',     title: 'Roast my landing page — FarmLink GM redesign',                                      body_preview: 'Pushed a new landing page yesterday. I think the hero is too text-heavy. Thoughts?', body: 'Pushed a new landing page yesterday. URL inside. Honest feedback welcome.\n\nMy suspicion is:\n• Hero is too text-heavy\n• The pricing section is confusing\n• Mobile layout breaks on small Tecno phones', author: { name: 'Musa Jallow' }, replies: 14, upvotes: 45,  last_reply_at: '8 hours ago',  pinned: false, follower_count: 22, reply_list: makeReplies(['Fatou Ceesay', 'Mariama Kah']) },
  { id: 't5',  category: 'jobs',          product_slug: null,                     title: 'Hiring: React Native dev for ClassMate GM (Banjul or remote)',                      body_preview: 'We\'re building the mobile companion to ClassMate. 2+ years RN experience…',     body: 'We\'re hiring a React Native dev to lead the ClassMate mobile build.\n\nMust-haves:\n• 2+ years RN in production\n• Comfortable with offline-first patterns\n• Based in The Gambia or West Africa timezone\n\nBudget: D40k–D60k/month plus equity. Apply with a Github + portfolio.', author: { name: 'Abdul Ikumpanyi', bio: 'Founder at ClassMate GM' }, replies: 8,  upvotes: 31,  last_reply_at: '12 hours ago', pinned: false, follower_count: 18, reply_list: makeReplies(['Sankung Jammeh']) },
  { id: 't6',  category: 'general',       product_slug: null,                     title: 'Anyone else losing customers to slow Wave settlement times?',                       body_preview: 'Had three users complain this week about funds taking 2-3 days to settle…',     body: 'Three users complained this week about Wave settlements taking 2-3 days. Has anyone built a buffer / pre-funded float to bridge the gap? Curious what others are doing.', author: { name: 'Aminata Touray' }, replies: 22, upvotes: 89,  last_reply_at: '1 day ago',    pinned: false, follower_count: 34, reply_list: makeReplies(['Momodou Jatta', 'Yusupha Touray', 'Saikou Camara']) },
  { id: 't7',  category: 'show-and-tell', product_slug: 'turntable-gm-w7c4r6',    title: 'Just shipped Turntable GM — streaming for Gambian artists',                         body_preview: 'After 18 months, our music platform for local artists is live. Demo + AMA inside.',  body: 'After 18 months and one rebrand, Turntable GM is finally live.\n\nWe pay 70% of revenue back to artists, no minimum streams required. We have 240 songs from 38 artists at launch.\n\nAMA — happy to talk product, music industry, or technical questions about streaming infra in West Africa.', author: { name: 'DJ Latir' }, replies: 41, upvotes: 156, last_reply_at: '1 day ago',    pinned: false, follower_count: 67, reply_list: makeReplies(['Awa Mboge', 'Fatim Singhateh', 'Modou Saine']) },
  { id: 't8',  category: 'help',          product_slug: null,                     title: 'Best way to send SMS to all four mobile networks?',                                 body_preview: 'Comium, Africell, QCell, Gamtel — building a notification system that hits all…', body: 'Building a notification system that needs to reach all four Gambian mobile networks. Africa\'s Talking covers Africell and QCell well, but Gamtel is hit-or-miss.\n\nAnyone found a clean solution?', author: { name: 'Lamin Touray' }, replies: 11, upvotes: 38,  last_reply_at: '2 days ago',   pinned: false, follower_count: 14, reply_list: makeReplies(['Babucarr Sowe', 'Yusupha Touray']) },
  { id: 't9',  category: 'general',       product_slug: null,                     title: 'Should LaunchedChit add a "Built in Banjul" badge?',                                body_preview: 'Some founders are based in Dakar / London but build for The Gambia. Should we…',  body: 'Right now we don\'t distinguish between products built in The Gambia vs built elsewhere for the Gambian market. Should there be a "Built in Banjul" / "Built in Brikama" badge for products with operations on the ground?', author: { name: 'Fatim Singhateh' }, replies: 28, upvotes: 73,  last_reply_at: '2 days ago',   pinned: false, follower_count: 25, reply_list: makeReplies(['Musa Jallow', 'Aminata Touray']) },
  { id: 't10', category: 'off-topic',     product_slug: null,                     title: 'Best ataya spots in Serekunda for a long coding session?',                          body_preview: 'Need somewhere with wifi, plug points, and ataya. Recommendations welcome.',     body: 'Need somewhere with reliable wifi, plug points, and an endless supply of ataya. Bonus points if it doesn\'t blast football all day.', author: { name: 'Sankung Jammeh' }, replies: 35, upvotes: 84,  last_reply_at: '3 days ago',   pinned: false, follower_count: 12, reply_list: makeReplies(['Pa Modou Faal', 'Ousainou Jagne']) },
  { id: 't11', category: 'feedback',      product_slug: 'banjul-eats-d8h3k1',     title: 'Banjul Eats checkout flow — 3 of 5 testers gave up',                                body_preview: 'Did a small usability test, attaching the recordings. Anyone want to help debug?',  body: 'Ran 5 unmoderated tests on the checkout flow. 3 of 5 dropped off at the address picker. Recordings + observations inside. Fresh eyes welcome.', author: { name: 'Fatou Ceesay' }, replies: 18, upvotes: 52,  last_reply_at: '4 days ago',   pinned: false, follower_count: 9,  reply_list: makeReplies(['Lamin Saho', 'Awa Mboge']) },
  { id: 't12', category: 'general',       product_slug: null,                     title: 'Kombo founder dinner — who\'s in for next month?',                                  body_preview: 'Trying to organise a casual dinner for builders in the Kombo area. RSVP inside.',  body: 'Casual dinner for Gambian builders in the Kombo area. Thinking 12-15 people, simple venue, everyone pays for their own food. Reply if interested and I\'ll send a poll for the date.', author: { name: 'Mariama Kah' }, replies: 24, upvotes: 61,  last_reply_at: '5 days ago',   pinned: false, follower_count: 31, reply_list: makeReplies(['Adama Saidy', 'Saikou Camara']) },
]

type Event = {
  id: string
  slug: string
  title: string
  start: string
  end: string
  location: string
  address?: string
  mode: 'In person' | 'Online'
  host: string
  host_bio?: string
  description: string
  agenda?: Array<{ time: string; item: string }>
  attendees: number
  capacity: number
  color: string
  cover_color: string
  topics?: string[]
}

const eventColors = ['#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309', '#065F46', '#9D174D']

function evt(
  i: number,
  base: Omit<Event, 'id' | 'slug' | 'color' | 'cover_color' | 'end'> & { duration_h?: number }
): Event {
  const start = new Date(base.start)
  const end = new Date(start.getTime() + (base.duration_h ?? 2) * 3600000)
  return {
    id: `e${i}`,
    slug: base.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    color: eventColors[i % eventColors.length],
    cover_color: eventColors[(i + 3) % eventColors.length],
    end: end.toISOString(),
    ...base,
  }
}

const mockEvents: Event[] = [
  evt(1,  { title: 'Builders Meetup — Banjul Edition',                   start: '2026-05-08T18:00:00', duration_h: 3, location: 'Café Touba, Bertil Harding Highway', address: 'Bertil Harding Hwy, Senegambia, The Gambia', mode: 'In person', host: 'Musa Jallow',          host_bio: 'Founder, FarmLink GM',         description: 'Casual evening for Gambian makers. Bring a demo, leave with feedback. Drinks on us for the first 30 RSVPs.', attendees: 47,  capacity: 60,  topics: ['Networking', 'Show & Tell'], agenda: [{ time: '18:00', item: 'Welcome + drinks' }, { time: '18:30', item: 'Lightning demos (5 min each)' }, { time: '19:30', item: 'Open mingling' }] }),
  evt(2,  { title: 'Mobile Money APIs — Workshop',                       start: '2026-05-15T15:00:00', duration_h: 2, location: 'Online · Google Meet',                  mode: 'Online',    host: 'Momodou Jatta',         host_bio: 'Co-founder, PayGam',           description: 'Hands-on workshop on integrating Wave, QMoney, and Africell Money APIs. Live coding, no slides.',         attendees: 124, capacity: 200, topics: ['Fintech', 'APIs'] }),
  evt(3,  { title: 'Demo Night — May Cohort',                            start: '2026-05-22T19:00:00', duration_h: 2, location: 'TechHub Brikama',                       address: 'Brikama, West Coast Region',           mode: 'In person', host: 'LaunchedChit',          description: 'Five Gambian startups demo what they shipped this month. 5 minutes each. 5 questions each. Audience votes.', attendees: 89,  capacity: 100, topics: ['Demo Day'] }),
  evt(4,  { title: 'Designing for Low Bandwidth — Talk',                 start: '2026-06-03T17:00:00', duration_h: 1, location: 'Online · YouTube Live',                 mode: 'Online',    host: 'Lamin Saho',            host_bio: 'Designer at Banjul Eats',      description: 'How we got Banjul Eats to load in <2s on a 3G connection. Practical performance tips.',                       attendees: 56,  capacity: 500, topics: ['Engineering', 'Design'] }),
  evt(5,  { title: 'Founder Coffee — Kombo Mornings',                    start: '2026-05-04T08:00:00', duration_h: 2, location: 'Sandele Eco Café, Kololi',              address: 'Kololi, The Gambia',                   mode: 'In person', host: 'Aminata Touray',                                                  description: 'Weekly informal coffee for Gambian founders. No agenda. Just early-morning honesty about what\'s working and what isn\'t.', attendees: 14, capacity: 20, topics: ['Networking'] }),
  evt(6,  { title: 'Pitch Practice — Pre-YC Workshop',                   start: '2026-05-12T14:00:00', duration_h: 3, location: 'Online · Zoom',                         mode: 'Online',    host: 'Abdul Ikumpanyi',                                                 description: 'Got a YC application coming up? We\'ll do live mock pitches with a panel of seasoned operators. 8 slots, first come first served.',                                                                attendees: 8,  capacity: 8,   topics: ['Fundraising'] }),
  evt(7,  { title: 'Tabaski Build Sprint',                               start: '2026-05-25T10:00:00', duration_h: 8, location: 'Innovarx Hub, Fajara',                  address: 'Fajara, KMC',                          mode: 'In person', host: 'Fatou Ceesay',                                                    description: 'One-day build sprint focused on Tabaski-related tools. Ship something useful by 18:00 or your money back (it\'s free).',                                                                            attendees: 32, capacity: 40,  topics: ['Hackathon'] }),
  evt(8,  { title: 'Designing Inclusive Forms in Wolof',                 start: '2026-06-10T16:00:00', duration_h: 1, location: 'Online · Google Meet',                  mode: 'Online',    host: 'Mariama Kah',                                                     description: 'Form UX patterns that don\'t assume English literacy. Worked examples from KYC, banking, and government services.',                                                                                  attendees: 41, capacity: 100, topics: ['Design', 'Localisation'] }),
  evt(9,  { title: 'Maker Show & Tell — Live AMA',                       start: '2026-06-17T18:30:00', duration_h: 2, location: 'Café Touba, Senegambia',                address: 'Senegambia, KMC',                      mode: 'In person', host: 'LaunchedChit',                                                    description: 'Three featured makers talk through their build, money, and lessons. Audience Q&A throughout.',                                                                                                       attendees: 23, capacity: 50,  topics: ['Show & Tell'] }),
  evt(10, { title: 'Securing Your App — OWASP for African Startups',     start: '2026-06-24T15:00:00', duration_h: 2, location: 'Online · YouTube Live',                 mode: 'Online',    host: 'Saikou Camara',                                                   description: 'Practical security primer: auth, secrets, rate-limiting, and what gets exploited in West African web apps.',                                                                                          attendees: 67, capacity: 300, topics: ['Engineering', 'Security'] }),
  evt(11, { title: 'Fish-Tech Roundtable',                               start: '2026-07-02T11:00:00', duration_h: 2, location: 'Tanji Fish Landing Site',                address: 'Tanji, West Coast Region',             mode: 'In person', host: 'Pa Sait Jallow',        host_bio: 'Founder, FishMarket',          description: 'Operators in fishing, cold-chain, and logistics meet to talk problems and partnerships. Lunch provided.',                                                                                          attendees: 18, capacity: 30,  topics: ['Agritech', 'Logistics'] }),
  evt(12, { title: 'Builders × Banks — A Conversation',                  start: '2026-07-09T14:00:00', duration_h: 2, location: 'Bank of The Gambia, Banjul',            address: '1/2 Ecowas Ave, Banjul',               mode: 'In person', host: 'Yusupha Touray',                                                  description: 'Open conversation between builders and BoG / commercial bank reps on regulation, sandbox access, and licensing.',                                                                                  attendees: 38, capacity: 60,  topics: ['Fintech', 'Policy'] }),
  evt(13, { title: 'Wolof × English UX Copy Workshop',                   start: '2026-07-16T17:00:00', duration_h: 2, location: 'Online · Zoom',                         mode: 'Online',    host: 'Modou Lamin Joof',      host_bio: 'WolofTranslate',               description: 'Write product copy that flips between Wolof and English without losing voice. Bring a screen of your own product.',                                                                                attendees: 29, capacity: 80,  topics: ['Localisation', 'Design'] }),
  evt(14, { title: 'Demo Night — June Cohort',                           start: '2026-06-26T19:00:00', duration_h: 2, location: 'TechHub Brikama',                       address: 'Brikama',                              mode: 'In person', host: 'LaunchedChit',                                                    description: 'Six Gambian startups present. Same format as May. New makers, fresh demos.',                                                                                                                         attendees: 51, capacity: 100, topics: ['Demo Day'] }),
  evt(15, { title: 'Postgres for Product Engineers',                     start: '2026-07-23T15:00:00', duration_h: 2, location: 'Online · Google Meet',                  mode: 'Online',    host: 'Lamin Touray',                                                    description: 'Indexes, JSONB, partial indexes, RLS. The 80% you actually need on a small team.',                                                                                                                  attendees: 44, capacity: 200, topics: ['Engineering'] }),
  evt(16, { title: 'Women in Gambian Tech — Quarterly Meetup',           start: '2026-07-29T18:00:00', duration_h: 3, location: 'Coco Ocean Resort, Bijilo',             address: 'Bijilo, KMC',                          mode: 'In person', host: 'Awa Mboge',                                                       description: 'Quarterly gathering of women builders, designers, engineers, and operators in Gambian tech. Drinks + speed-mentoring.',                                                                              attendees: 56, capacity: 80,  topics: ['Networking'] }),
  evt(17, { title: 'Going Multi-Region — Architecture Talk',             start: '2026-08-05T16:00:00', duration_h: 1, location: 'Online · YouTube Live',                 mode: 'Online',    host: 'Babucarr Sowe',                                                   description: 'How Serekunda Rent expanded into Senegal in two months without rewriting the backend. Architecture decisions and trade-offs.',                                                                       attendees: 22, capacity: 500, topics: ['Engineering'] }),
  evt(18, { title: 'Hackathon — 24 Hours, One Tool for Tabaski',         start: '2026-08-12T09:00:00', duration_h: 24, location: 'Innovarx Hub, Fajara',                 address: 'Fajara, KMC',                          mode: 'In person', host: 'LaunchedChit',                                                    description: 'Build a tool that makes Tabaski easier — for buyers, sellers, or anyone in between. Best three teams win Wave gift cards and a feature on LaunchedChit.',                                            attendees: 78, capacity: 100, topics: ['Hackathon'] }),
  evt(19, { title: 'Office Hours with Wave (Public)',                    start: '2026-08-20T14:00:00', duration_h: 2, location: 'Online · Zoom',                         mode: 'Online',    host: 'Wave team',                                                       description: 'The Wave dev relations team takes questions on integrations, settlement, and the API roadmap.',                                                                                                       attendees: 113, capacity: 500, topics: ['Fintech', 'APIs'] }),
  evt(20, { title: 'End-of-Summer Builders Cookout',                    start: '2026-08-29T17:00:00', duration_h: 4, location: 'Cape Point Beach, Bakau',                address: 'Bakau, KMC',                           mode: 'In person', host: 'LaunchedChit',                                                    description: 'Sundowner on the beach with the Gambian builder community. Bring family. We\'ll handle the food.',                                                                                                  attendees: 92, capacity: 150, topics: ['Networking'] }),
]

type RequestExtras = {
  audience: string | null
  requester_email: string | null
  requester_phones: string[]
  pay_pledges: Array<{ amount: number; currency: 'GMD' | 'USD' }>
}

/*
  In-memory comment inbox store. Generated on demand from the maker's
  product slice; per-comment status (unread/replied/archived) survives
  across requests within the session so reply/archive actions stick
  while you tab around the inbox.
*/
type CommentInboxItem = {
  id: string
  product_id: string
  product_slug: string
  product_name: string
  author: string
  author_username: string
  avatar_color: string
  body: string
  created_at: string
  status: 'unread' | 'replied' | 'archived'
}
// Maker engagement stores ----------------------------------------------------

type Notification = {
  id: string
  kind: 'comment' | 'upvote' | 'waitlist' | 'follow' | 'mention' | 'system'
  title: string
  body: string
  actor: { name: string; username: string; avatar_color: string } | null
  href: string
  created_at: string
  read: boolean
}
const notificationsStore = (() => {
  const seedNames = ['Awa Touray', 'Modou Jatta', 'Lamin Saho', 'Fatou Ceesay', 'Binta Ceesay', 'Yusupha Touray', 'Mariama Kah', 'Pa Modou Faal']
  const seedColors = ['#2563EB', '#0891B2', '#1E40AF', '#06B6D4', '#0E7490', '#3B82F6', '#1D4ED8', '#0EA5E9']
  const items: Notification[] = [
    { id: 'n1', kind: 'comment',  title: 'New comment on FarmLink GM', body: '"How does this handle offline sync?"', actor: { name: seedNames[0], username: 'awa-touray', avatar_color: seedColors[0] }, href: '/dashboard/inbox', created_at: '12 min ago', read: false },
    { id: 'n2', kind: 'waitlist', title: '12 new waitlist signups',     body: 'Across PayGam (8) and FarmLink GM (4).',                                       actor: null,                                                                                                  href: '/dashboard/waitlist', created_at: '1 hour ago',  read: false },
    { id: 'n3', kind: 'upvote',   title: '+47 upvotes on PayGam',       body: 'You\'re #2 in Fintech today.',                                                  actor: null,                                                                                                  href: '/p/paygam-b7x2m1', created_at: '3 hours ago', read: false },
    { id: 'n4', kind: 'follow',   title: 'Modou Jatta followed you',    body: 'They build PayGam and Maano Savings.',                                          actor: { name: seedNames[1], username: 'modou-jatta', avatar_color: seedColors[1] }, href: '/dashboard/followers', created_at: '6 hours ago', read: false },
    { id: 'n5', kind: 'mention',  title: 'You were mentioned in a thread', body: '"…@musa-jallow shipped FarmLink in 14 months — talk to him."',              actor: { name: seedNames[2], username: 'lamin-saho', avatar_color: seedColors[2] }, href: '/dashboard/mentions', created_at: 'yesterday', read: true },
    { id: 'n6', kind: 'system',   title: 'Weekly digest is ready',      body: 'Highlights from your products this week.',                                       actor: null,                                                                                                  href: '/dashboard', created_at: '2 days ago', read: true },
    { id: 'n7', kind: 'comment',  title: 'New comment on Banjul Eats',  body: '"Tested the iOS build. Crashes on Android 11."',                                actor: { name: seedNames[3], username: 'fatou-ceesay', avatar_color: seedColors[3] }, href: '/dashboard/inbox', created_at: '3 days ago', read: true },
    { id: 'n8', kind: 'follow',   title: 'Binta Ceesay followed you',   body: 'They write about Gambian community tools.',                                       actor: { name: seedNames[4], username: 'binta-ceesay', avatar_color: seedColors[4] }, href: '/dashboard/followers', created_at: '4 days ago', read: true },
  ]
  return {
    list: () => items,
    setRead: (id: string, read: boolean) => { const n = items.find((x) => x.id === id); if (n) n.read = read },
    markAllRead: () => { items.forEach((n) => { n.read = true }) },
  }
})()

type Follower = {
  username: string
  name: string
  bio: string
  avatar_color: string
  product_count: number
  is_following: boolean
  followed_at: string
}
const followersStore = (() => {
  const followers: Follower[] = [
    { username: 'awa-touray',     name: 'Awa Touray',      bio: 'Engineering Lead, Kombo Health',          avatar_color: '#2563EB', product_count: 2, is_following: true,  followed_at: '4 days ago' },
    { username: 'modou-jatta',    name: 'Modou Jatta',     bio: 'Co-founder, PayGam',                      avatar_color: '#0891B2', product_count: 1, is_following: true,  followed_at: '1 week ago' },
    { username: 'lamin-saho',     name: 'Lamin Saho',      bio: 'Designer & developer in Banjul',          avatar_color: '#1E40AF', product_count: 0, is_following: false, followed_at: '2 weeks ago' },
    { username: 'fatou-ceesay',   name: 'Fatou Ceesay',    bio: 'Founder, Banjul Eats',                    avatar_color: '#06B6D4', product_count: 1, is_following: true,  followed_at: '3 weeks ago' },
    { username: 'binta-ceesay',   name: 'Binta Ceesay',    bio: 'Writer · maker · ataya enthusiast',       avatar_color: '#0E7490', product_count: 0, is_following: false, followed_at: '1 month ago' },
    { username: 'yusupha-touray', name: 'Yusupha Touray',  bio: 'iWallet GM · multicurrency wallet',       avatar_color: '#3B82F6', product_count: 1, is_following: false, followed_at: '1 month ago' },
    { username: 'mariama-kah',    name: 'Mariama Kah',     bio: 'Founder, Gambianect',                     avatar_color: '#1D4ED8', product_count: 1, is_following: false, followed_at: '2 months ago' },
  ]
  const following: Follower[] = followers.filter((f) => f.is_following).map((f) => ({ ...f }))
  // Add some that you follow but don't follow you back
  following.push(
    { username: 'dj-latir',       name: 'DJ Latir',        bio: 'Building Turntable GM',                    avatar_color: '#0EA5E9', product_count: 1, is_following: true, followed_at: '5 days ago' },
    { username: 'ousman-bah',     name: 'Ousman Bah',      bio: 'Taxi GM · ride-hailing for Banjul',       avatar_color: '#1E40AF', product_count: 1, is_following: true, followed_at: '2 weeks ago' },
  )
  return {
    list: (direction: 'followers' | 'following') => direction === 'followers' ? followers : following,
    setFollowing: (username: string, on: boolean) => {
      const f = followers.find((x) => x.username === username)
      if (f) f.is_following = on
      // mirror to following list
      const idx = following.findIndex((x) => x.username === username)
      if (on && idx === -1) {
        const seed = followers.find((x) => x.username === username)
        if (seed) following.push({ ...seed, is_following: true })
      } else if (!on && idx !== -1) {
        following.splice(idx, 1)
      }
    },
  }
})()

type Mention = {
  id: string
  context: 'thread' | 'comment' | 'request'
  source_title: string
  source_href: string
  excerpt: string
  actor: { name: string; username: string; avatar_color: string }
  created_at: string
}
const mockMentions: Mention[] = [
  { id: 'm1', context: 'thread',  source_title: 'What is the biggest blocker for Gambian startups in 2026?', source_href: '/community/threads/t1',  excerpt: '…would love to hear @musa-jallow\'s take on the talent question.',                            actor: { name: 'Lamin Saho',  username: 'lamin-saho', avatar_color: '#1E40AF' }, created_at: '2 hours ago' },
  { id: 'm2', context: 'comment', source_title: 'PayGam — we hit 10,000 transactions yesterday',              source_href: '/p/paygam-b7x2m1',     excerpt: '@musa-jallow you should compare notes with this team.',                                       actor: { name: 'Awa Touray',  username: 'awa-touray', avatar_color: '#2563EB' }, created_at: 'yesterday' },
  { id: 'm3', context: 'request', source_title: 'A reliable WhatsApp broadcast scheduler',                    source_href: '/community/requests/r1', excerpt: 'cc @musa-jallow — this might fit alongside FarmLink\'s notifications.',                       actor: { name: 'Aminata Touray', username: 'aminata-touray', avatar_color: '#0891B2' }, created_at: '3 days ago' },
  { id: 'm4', context: 'thread',  source_title: 'Anyone else losing customers to slow Wave settlement times?', source_href: '/community/threads/t6', excerpt: '@musa-jallow ran into this with FarmLink\'s payouts.',                                        actor: { name: 'Mariama Kah', username: 'mariama-kah', avatar_color: '#1D4ED8' }, created_at: '1 week ago' },
]

type AccountPrefs = {
  notify_comments: boolean
  notify_upvotes: boolean
  notify_waitlist: boolean
  notify_followers: boolean
  notify_mentions: boolean
  weekly_digest: boolean
  product_announcements: boolean
}
const accountPrefsStore = (() => {
  let prefs: AccountPrefs = {
    notify_comments: true,
    notify_upvotes: true,
    notify_waitlist: true,
    notify_followers: true,
    notify_mentions: true,
    weekly_digest: true,
    product_announcements: false,
  }
  return {
    get: () => prefs,
    update: (patch: Partial<AccountPrefs>) => { prefs = { ...prefs, ...patch } },
  }
})()

type ProductEditExtras = Partial<{
  description: string
  website_url: string
  pricing: string
  license: 'open-source' | 'commercial' | 'free'
  ios_url: string | null
  android_url: string | null
  source_url: string | null
}>
const productEditExtras = new Map<string, ProductEditExtras>()

const commentInboxStore = (() => {
  const map = new Map<string, CommentInboxItem>()
  return {
    upsert(item: CommentInboxItem) {
      const existing = map.get(item.id)
      if (existing) return existing
      map.set(item.id, item)
      return item
    },
    setStatus(id: string, status: CommentInboxItem['status']) {
      const item = map.get(id)
      if (item) item.status = status
    },
  }
})()
const requestExtras = new Map<string, RequestExtras>()

const mockRequests = [
  { id: 'r1', title: 'A reliable WhatsApp broadcast scheduler', body: 'We run an osusu group of 200 people. Sending weekly updates to everyone is painful. Need a tool that schedules and sends WhatsApp messages.', requester: { name: 'Aminata Touray' }, upvotes: 142, responses: 4, status: 'open',     created_at: '3 days ago' },
  { id: 'r2', title: 'Bus schedule for the Brikama–Banjul route',    body: 'No app shows me when the next gele-gele leaves. Just a simple schedule + ETA would change my life.',                                                          requester: { name: 'Ousman Bah' },     upvotes: 98,  responses: 2, status: 'in-progress', created_at: '5 days ago' },
  { id: 'r3', title: 'Land registry lookup',                          body: 'Want to verify ownership of a plot before signing anything. Currently requires multiple in-person trips. Even a basic public lookup would help.',         requester: { name: 'Babucarr Sowe' }, upvotes: 76,  responses: 1, status: 'open',     created_at: '1 week ago' },
  { id: 'r4', title: 'Mosque prayer time + adhan widget',             body: 'Local mosques each have slightly different times. An app showing the nearest mosque\'s schedule with adhan playback would be amazing for the diaspora.',     requester: { name: 'Modou Saine' },   upvotes: 63,  responses: 0, status: 'open',     created_at: '1 week ago' },
  { id: 'r5', title: 'Voter registration status checker',             body: 'Election season approaches. People want to know if they\'re registered without trekking to the IEC office. SMS-based query would work for non-smartphone users.', requester: { name: 'Saikou Camara' }, upvotes: 51,  responses: 3, status: 'open',     created_at: '2 weeks ago' },
  { id: 'r6', title: 'Local artist booking marketplace',               body: 'Hiring a kora player or DJ for a wedding is all word-of-mouth. A marketplace with profiles, prices, and reviews would unlock real money for these artists.',  requester: { name: 'Fatim Singhateh' }, upvotes: 38, responses: 0, status: 'open',     created_at: '2 weeks ago' },
  { id: 'r7', title: 'Open API for GRA tax rates',                    body: 'Building a small accounting tool. Would love a public, machine-readable source of VAT and income tax brackets. Currently parsing a PDF every quarter.',       requester: { name: 'Lamin Touray' },  upvotes: 22,  responses: 1, status: 'open',     created_at: '3 weeks ago' },
]

const mockProfile = {
  id: 'user-001',
  username: 'musa-jallow',
  name: 'Musa Jallow',
  tagline: 'Founder · Product engineer',
  bio: 'Building products for The Gambia from Banjul. Currently building FarmLink GM full-time. Previously: built two B2B tools that didn\'t make it. Always interested in conversations about distribution, payments, and ag.',
  location: 'Banjul, The Gambia',
  joined_at: '2024-08-12',
  avatar_url: null,
  cover_color: '#2563EB',
  website: 'https://musajallow.com',
  github: 'https://github.com/musajallow',
  twitter: 'https://twitter.com/musajallow',
  linkedin: 'https://linkedin.com/in/musajallow',
  email: 'musa@example.com' as string | null,
  phone: null as string | null,
  followers: 412,
  following: 67,
  total_upvotes: 318,
  products: mockProducts.filter((p) => p.maker.name === 'Musa Jallow'),
}

let products = [...mockProducts]
let votes = new Set<string>()

/*
  Persist session across page reloads via localStorage so the MSW
  module-level state isn't reset every time window.location.href changes.
  Without this, login -> reload to /submit -> MSW reinit -> sessionActive=false
  bounces the user right back to /login. SSR-safe via the typeof check.
*/
const SESSION_KEY = 'launchedchit:mock-session'
const STORAGE_AVAILABLE = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

let sessionActive: boolean = STORAGE_AVAILABLE
  ? window.localStorage.getItem(SESSION_KEY) === 'active'
  : false

function setSessionActive(active: boolean): void {
  sessionActive = active
  if (!STORAGE_AVAILABLE) return
  if (active) window.localStorage.setItem(SESSION_KEY, 'active')
  else window.localStorage.removeItem(SESSION_KEY)
}

export const handlers = [
  // POST /auth/magic-link
  http.post(`${BASE}/auth/magic-link`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /auth/login — password login.
  // Demo credentials: musa@example.com / password (or any password >= 6 chars
  // for any email — this is a mock, real validation happens server-side).
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; phone?: string; password?: string }
    if (!body.password || body.password.length < 6) {
      return new HttpResponse(null, { status: 401 })
    }
    if (!body.email && !body.phone) return new HttpResponse(null, { status: 400 })
    setSessionActive(true)
    return HttpResponse.json(mockUser)
  }),

  // POST /auth/signup — mirror of login for the demo.
  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as { name?: string; email?: string; phone?: string }
    if (!body.name || (!body.email && !body.phone)) return new HttpResponse(null, { status: 400 })
    if (body.name) mockUser.name = body.name
    if (body.email) mockUser.email = body.email
    setSessionActive(true)
    return HttpResponse.json(mockUser)
  }),

  // POST /auth/forgot-password — mock acknowledgement.
  http.post(`${BASE}/auth/forgot-password`, () => new HttpResponse(null, { status: 204 })),

  // POST /auth/reset-password — accepts any token + password >= 8 chars.
  http.post(`${BASE}/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as { token?: string; password?: string }
    if (!body.token || !body.password || body.password.length < 8) {
      return new HttpResponse(null, { status: 400 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /auth/verify-otp — accept the canonical demo code 123456.
  http.post(`${BASE}/auth/verify-otp`, async ({ request }) => {
    const body = (await request.json()) as { code?: string; purpose?: string }
    if (body.code !== '123456') return new HttpResponse(null, { status: 401 })
    if (body.purpose === 'reset') {
      return HttpResponse.json({ token: 'demo-reset-token' })
    }
    setSessionActive(true)
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /auth/send-otp — mock acknowledgement (used by OTP "resend" button).
  http.post(`${BASE}/auth/send-otp`, () => new HttpResponse(null, { status: 204 })),

  // GET /auth/callback
  http.get(`${BASE}/auth/callback`, () => {
    setSessionActive(true)
    return HttpResponse.redirect('http://localhost:3000/', 302)
  }),

  // POST /auth/logout
  http.post(`${BASE}/auth/logout`, () => {
    setSessionActive(false)
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

  // GET /me/dashboard/stats?period=7d|30d|90d
  http.get(`${BASE}/me/dashboard/stats`, ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const period = new URL(request.url).searchParams.get('period') ?? '7d'
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7

    // Treat the first 4 mock products as belonging to the signed-in user so
    // the dashboard demo shows a richer picture than the single FarmLink GM
    // entry that's actually authored by Musa Jallow.
    const myProducts = products.slice(0, 4)

    const totals = {
      upvotes:  myProducts.reduce((s, p) => s + p.vote_count, 0),
      comments: myProducts.reduce((s, p) => s + (p.comments_count ?? 0), 0),
      waitlist: myProducts.reduce((s, p) => s + (p.waitlist_count ?? 0), 0),
      profile_views: 1284,
    }

    const trend = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
      value: Math.max(0, Math.round(8 + Math.sin(i / 3) * 4 + (i % 5))),
    }))

    return HttpResponse.json({
      totals,
      deltas: { upvotes: 12, comments: 3, waitlist: 47, profile_views: -8 },
      period,
      trend,
      activity: [
        { id: 'a1', kind: 'upvote',  text: '3 new upvotes on FarmLink GM',                ago: '2h' },
        { id: 'a2', kind: 'comment', text: 'Fatou Ceesay commented on FarmLink GM',       ago: '5h' },
        { id: 'a3', kind: 'waitlist',text: '12 new waitlist signups this week',           ago: '1d' },
        { id: 'a4', kind: 'review',  text: 'New 5★ review on PayGam',                      ago: '2d' },
        { id: 'a5', kind: 'milestone', text: 'FarmLink GM crossed 250 upvotes',            ago: '3d' },
      ],
    })
  }),

  // GET /me/products?page=&page_size=&status=
  http.get(`${BASE}/me/products`, ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
    const pageSize = Math.max(1, Number(url.searchParams.get('page_size') ?? '12'))
    const statusFilter = url.searchParams.get('status') ?? ''

    // Same 4-product slice as /me/dashboard/stats for consistency.
    // Inject status variants here (not in source array) so the demo shows
    // off the StatusChip variants without polluting other handlers.
    const STATUSES = ['live', 'live', 'in-review', 'draft'] as const
    let mine = products.slice(0, 4).map((p, i) => withLicense({ ...p, status: STATUSES[i] }))

    if (statusFilter) mine = mine.filter((p) => (p as { status?: string }).status === statusFilter)

    const total = mine.length
    const start = (page - 1) * pageSize
    const items = mine.slice(start, start + pageSize)

    return HttpResponse.json({ items, total, page, page_size: pageSize })
  }),

  // PATCH /me/products/:slug — edit own product (name/tagline/description/etc.)
  http.patch(`${BASE}/me/products/:slug`, async ({ params, request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const slug = String(params.slug)
    const product = products.find((p) => p.slug === slug)
    if (!product) return new HttpResponse(null, { status: 404 })

    const body = (await request.json().catch(() => ({}))) as Partial<{
      name: string
      tagline: string
      description: string
      website_url: string
      logo_url: string | null
      pricing: string
      license: 'open-source' | 'commercial' | 'free'
      platforms: string[]
      ios_url: string | null
      android_url: string | null
      source_url: string | null
    }>

    if (typeof body.name === 'string' && body.name.trim()) product.name = body.name.trim()
    if (typeof body.tagline === 'string') product.tagline = body.tagline.trim()
    if (typeof body.logo_url !== 'undefined') (product as { logo_url: string | null }).logo_url = body.logo_url
    if (Array.isArray(body.platforms)) {
      (product as { platforms: string[] }).platforms = body.platforms.filter((p) => ['web', 'mobile', 'desktop'].includes(p))
    }
    // Persist editable extras on a per-product side store so the GET handler
    // can pick them up next time the public detail is fetched.
    productEditExtras.set(slug, {
      ...(productEditExtras.get(slug) ?? {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.website_url !== undefined ? { website_url: body.website_url } : {}),
      ...(body.pricing !== undefined ? { pricing: body.pricing } : {}),
      ...(body.license !== undefined ? { license: body.license } : {}),
      ...(body.ios_url !== undefined ? { ios_url: body.ios_url } : {}),
      ...(body.android_url !== undefined ? { android_url: body.android_url } : {}),
      ...(body.source_url !== undefined ? { source_url: body.source_url } : {}),
    })
    return HttpResponse.json({ slug, ok: true })
  }),

  // === Admin scope =====================================================

  // POST /admin/auth/login — only admin@launchedchit.gm with password "admin"
  http.post(`${BASE}/admin/auth/login`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string }
    if (body.email !== mockAdmin.email || body.password !== 'admin') {
      return new HttpResponse(JSON.stringify({ error: 'Invalid credentials.' }), { status: 401 })
    }
    adminSessionStage = 'mfa-required'
    if (!mockAdmin.mfa_enrolled) {
      return HttpResponse.json({ requires_enrollment: true })
    }
    return HttpResponse.json({ requires_mfa: true })
  }),

  // POST /admin/auth/mfa-verify — accept "123456" only
  http.post(`${BASE}/admin/auth/mfa-verify`, async ({ request }) => {
    if (adminSessionStage !== 'mfa-required') {
      return new HttpResponse(JSON.stringify({ error: 'No login in progress.' }), { status: 400 })
    }
    const body = (await request.json().catch(() => ({}))) as { code?: string }
    if (body.code !== '123456') {
      return new HttpResponse(JSON.stringify({ error: 'Invalid code.' }), { status: 401 })
    }
    setAdminSessionActive(true)
    return HttpResponse.json({ ok: true })
  }),

  // POST /admin/auth/enroll-start — return shared secret + provisioning URI
  http.post(`${BASE}/admin/auth/enroll-start`, () => {
    if (adminSessionStage !== 'mfa-required') {
      return new HttpResponse(JSON.stringify({ error: 'No login in progress.' }), { status: 400 })
    }
    return HttpResponse.json({
      secret: 'JBSWY3DPEHPK3PXP',
      otpauth_url: `otpauth://totp/LaunchedChit%20Admin:${encodeURIComponent(mockAdmin.email)}?secret=JBSWY3DPEHPK3PXP&issuer=LaunchedChit%20Admin`,
    })
  }),

  // POST /admin/auth/enroll-finish — accept "123456" to finish first-time enrollment
  http.post(`${BASE}/admin/auth/enroll-finish`, async ({ request }) => {
    if (adminSessionStage !== 'mfa-required') {
      return new HttpResponse(JSON.stringify({ error: 'No login in progress.' }), { status: 400 })
    }
    const body = (await request.json().catch(() => ({}))) as { code?: string }
    if (body.code !== '123456') {
      return new HttpResponse(JSON.stringify({ error: 'Invalid code.' }), { status: 401 })
    }
    mockAdmin.mfa_enrolled = true
    setAdminSessionActive(true)
    return HttpResponse.json({ ok: true })
  }),

  // GET /admin/me — returns admin user when fully authenticated
  http.get(`${BASE}/admin/me`, () => {
    if (!adminSessionActive) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json(mockAdmin)
  }),

  // POST /admin/auth/logout
  http.post(`${BASE}/admin/auth/logout`, () => {
    setAdminSessionActive(false)
    adminSessionStage = 'idle'
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /admin/dashboard/stats — basic moderation queue + activity stats
  http.get(`${BASE}/admin/dashboard/stats`, () => {
    if (!adminSessionActive) return new HttpResponse(null, { status: 401 })
    const days = 14
    const trend = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
      value: Math.max(0, Math.round(8 + Math.sin(i / 2) * 4 + (i % 5))),
    }))
    return HttpResponse.json({
      kpis: {
        signups_today:        24,
        signups_delta:        12,
        products_in_review:   7,
        comments_flagged:     3,
        threads_flagged:      2,
        active_makers_30d:    312,
        active_makers_delta:  18,
      },
      submissions_trend: trend,
      recent_activity: [
        { id: 'a1', kind: 'submission',  text: 'New product submission: "PayGam v2"',         actor: 'Momodou Jatta', ago: '12m', href: '/admin/products' },
        { id: 'a2', kind: 'report',      text: 'Comment reported on Banjul Eats',             actor: 'Awa Touray',    ago: '34m', href: '/admin/reports' },
        { id: 'a3', kind: 'maker',       text: 'New maker signup: Aminata Touray',            actor: 'system',         ago: '1h',  href: '/admin/makers' },
        { id: 'a4', kind: 'thread',      text: 'Thread flagged: "Looking for an iOS dev"',    actor: 'Lamin Saho',    ago: '2h',  href: '/admin/threads' },
        { id: 'a5', kind: 'request',     text: 'Product request: "Open API for GRA tax rates"', actor: 'Lamin Touray', ago: '4h',  href: '/admin/requests' },
      ],
    })
  }),

  // GET /me/notifications?status=unread|all
  http.get(`${BASE}/me/notifications`, ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const status = new URL(request.url).searchParams.get('status') ?? 'unread'
    const all = notificationsStore.list()
    const filtered = status === 'all' ? all : all.filter((n) => !n.read)
    return HttpResponse.json({
      items: filtered,
      counts: { all: all.length, unread: all.filter((n) => !n.read).length },
    })
  }),

  // POST /me/notifications/:id/read
  http.post(`${BASE}/me/notifications/:id/read`, ({ params }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    notificationsStore.setRead(String(params.id), true)
    return HttpResponse.json({ ok: true })
  }),

  // POST /me/notifications/read-all
  http.post(`${BASE}/me/notifications/read-all`, () => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    notificationsStore.markAllRead()
    return HttpResponse.json({ ok: true })
  }),

  // GET /me/followers?direction=followers|following
  http.get(`${BASE}/me/followers`, ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const direction = new URL(request.url).searchParams.get('direction') ?? 'followers'
    return HttpResponse.json({
      items: followersStore.list(direction === 'following' ? 'following' : 'followers'),
      counts: {
        followers: followersStore.list('followers').length,
        following: followersStore.list('following').length,
      },
    })
  }),

  // POST /me/followers/:username/follow
  http.post(`${BASE}/me/followers/:username/follow`, ({ params }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    followersStore.setFollowing(String(params.username), true)
    return HttpResponse.json({ ok: true, following: true })
  }),

  // DELETE /me/followers/:username/follow
  http.delete(`${BASE}/me/followers/:username/follow`, ({ params }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    followersStore.setFollowing(String(params.username), false)
    return HttpResponse.json({ ok: true, following: false })
  }),

  // GET /me/mentions
  http.get(`${BASE}/me/mentions`, () => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json({ items: mockMentions })
  }),

  // GET /me/account — maker account info + notification prefs
  http.get(`${BASE}/me/account`, () => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json({
      name: mockUser.name,
      email: mockUser.email ?? 'musa@example.com',
      handle: mockUser.name.toLowerCase().replace(/\s+/g, '-'),
      created_at: '2024-08-12',
      preferences: accountPrefsStore.get(),
    })
  }),

  // PATCH /me/account — update prefs / display name / email
  http.patch(`${BASE}/me/account`, async ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const body = (await request.json().catch(() => ({}))) as Partial<{
      name: string
      email: string
      preferences: Partial<AccountPrefs>
    }>
    if (typeof body.name === 'string' && body.name.trim()) mockUser.name = body.name.trim()
    if (typeof body.email === 'string' && body.email.trim()) mockUser.email = body.email.trim()
    if (body.preferences) accountPrefsStore.update(body.preferences)
    return HttpResponse.json({
      name: mockUser.name,
      email: mockUser.email,
      preferences: accountPrefsStore.get(),
    })
  }),

  // POST /me/account/delete — placeholder soft-delete
  http.post(`${BASE}/me/account/delete`, async ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const body = (await request.json().catch(() => ({}))) as { confirm?: string }
    if (body.confirm !== mockUser.name) {
      return new HttpResponse(JSON.stringify({ error: 'Confirmation does not match.' }), { status: 400 })
    }
    setSessionActive(false)
    return HttpResponse.json({ ok: true })
  }),

  // GET /me/products/:slug/analytics?period=7d|30d|90d|1y — per-product drilldown
  http.get(`${BASE}/me/products/:slug/analytics`, ({ params, request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const period = new URL(request.url).searchParams.get('period') ?? '30d'
    const days = period === '1y' ? 365 : period === '90d' ? 90 : period === '7d' ? 7 : 30

    const myProducts = products.slice(0, 4)
    const product = myProducts.find((p) => p.slug === String(params.slug))
    if (!product) return new HttpResponse(null, { status: 404 })

    const idx = myProducts.indexOf(product)
    const seed = product.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

    const upvotes_trend = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
      value: Math.max(0, Math.round(2 + Math.sin((i + idx * 5) / 4) * 3 + (i % 7))),
    }))
    const waitlist_trend = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
      value: Math.max(0, Math.round(1 + Math.cos((i + idx * 3) / 5) * 2 + (i % 4))),
    }))
    const views_trend = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
      value: Math.max(0, Math.round(40 + Math.sin((i + idx * 2) / 3) * 25 + (i % 11) * 4)),
    }))
    const comments_trend = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
      value: Math.max(0, Math.round(Math.cos((i + idx) / 6) * 1.5 + (i % 5))),
    }))

    const totals = {
      upvotes: upvotes_trend.reduce((s, d) => s + d.value, 0),
      waitlist: waitlist_trend.reduce((s, d) => s + d.value, 0),
      views: views_trend.reduce((s, d) => s + d.value, 0),
      comments: comments_trend.reduce((s, d) => s + d.value, 0),
    }

    // Compare against the previous period of the same length.
    const prevTotals = {
      upvotes: Math.round(totals.upvotes * (0.7 + ((seed % 5) / 10))),
      waitlist: Math.round(totals.waitlist * (0.6 + ((seed % 7) / 10))),
      views: Math.round(totals.views * (0.85 + ((seed % 4) / 10))),
      comments: Math.round(totals.comments * (0.55 + ((seed % 9) / 10))),
    }

    // Rough acquisition mix
    const sources = [
      { source: 'Direct',      pct: 38 + (seed % 7) },
      { source: 'Search',      pct: 22 + (seed % 5) },
      { source: 'Social',      pct: 14 + (seed % 6) },
      { source: 'Referral',    pct: 12 + (seed % 4) },
      { source: 'Newsletter',  pct: 8  + (seed % 3) },
      { source: 'Other',       pct: 6 },
    ]

    // Top 5 referrers (deterministic)
    const referrers = [
      { host: 'twitter.com',           visits: 220 + ((seed * 11) % 200) },
      { host: 't.me',                  visits: 140 + ((seed * 7) % 160) },
      { host: 'launchedchit.gm',       visits: 95  + ((seed * 5) % 120) },
      { host: 'github.com',            visits: 60  + ((seed * 13) % 80) },
      { host: 'dev.to',                visits: 28  + ((seed * 17) % 50) },
    ]

    return HttpResponse.json({
      product: { id: product.id, slug: product.slug, name: product.name, tagline: product.tagline, status: 'live' },
      period,
      days,
      totals,
      previous_totals: prevTotals,
      upvotes_trend,
      waitlist_trend,
      views_trend,
      comments_trend,
      sources,
      referrers,
    })
  }),

  // GET /me/comments/inbox — comments left on the signed-in maker's products
  http.get(`${BASE}/me/comments/inbox`, ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const url = new URL(request.url)
    const status = url.searchParams.get('status') ?? 'unread'
    const productSlug = url.searchParams.get('product') ?? ''

    const myProducts = products.slice(0, 4)
    const items = myProducts.flatMap((p, pi) => {
      const count = [9, 6, 4, 3][pi] ?? 3
      return Array.from({ length: count }, (_, i) => {
        const seed = pi * 17 + i
        return commentInboxStore.upsert({
          id: `cm-${p.id}-${i}`,
          product_id: p.id,
          product_slug: p.slug,
          product_name: p.name,
          author: ['Awa Touray', 'Modou Jatta', 'Lamin Saho', 'Fatou Ceesay', 'Binta Ceesay', 'Yusupha Touray', 'Mariama Kah', 'Pa Modou Faal'][(seed * 3) % 8],
          author_username: ['awa-touray', 'modou-jatta', 'lamin-saho', 'fatou-ceesay', 'binta-ceesay', 'yusupha-touray', 'mariama-kah', 'pa-modou-faal'][(seed * 3) % 8],
          avatar_color: ['#2563EB', '#0891B2', '#1E40AF', '#06B6D4', '#0E7490', '#3B82F6', '#1D4ED8', '#0EA5E9'][(seed * 3) % 8],
          body: [
            'How does this handle offline sync? Asking because rural connectivity here is rough.',
            'Just signed up — can I import contacts from a CSV?',
            'This is exactly what I was looking for. When does the API ship?',
            'Pricing page seems to be missing. What\'s the cost?',
            'Tested the iOS build. Crashes on Android 11 — happy to share logs.',
            'Love it. Mind if we recommend this in our next newsletter?',
            'Saw a typo on the landing page hero. DM\'d you the screenshot.',
            'Would you consider open-sourcing the SMS gateway piece?',
          ][(seed * 7) % 8],
          created_at: ['1h ago', '3h ago', '6h ago', 'yesterday', '2 days ago', '4 days ago', '1 week ago'][seed % 7],
          status: 'unread' as 'unread' | 'replied' | 'archived',
        })
      })
    })

    let filtered = items
    if (status !== 'all') filtered = filtered.filter((c) => c.status === status)
    if (productSlug) filtered = filtered.filter((c) => c.product_slug === productSlug)

    const counts = {
      all: items.length,
      unread: items.filter((c) => c.status === 'unread').length,
      replied: items.filter((c) => c.status === 'replied').length,
      archived: items.filter((c) => c.status === 'archived').length,
    }

    return HttpResponse.json({
      items: filtered,
      counts,
      products: myProducts.map((p) => ({ slug: p.slug, name: p.name })),
    })
  }),

  // POST /me/comments/:id/reply — record a reply, mark as replied
  http.post(`${BASE}/me/comments/:id/reply`, async ({ params, request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const body = (await request.json().catch(() => ({}))) as { body?: string }
    if (!body.body || !body.body.trim()) return new HttpResponse(JSON.stringify({ error: 'Empty reply' }), { status: 400 })
    commentInboxStore.setStatus(String(params.id), 'replied')
    return HttpResponse.json({ id: params.id, status: 'replied' })
  }),

  // POST /me/comments/:id/archive — move out of inbox
  http.post(`${BASE}/me/comments/:id/archive`, ({ params }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    commentInboxStore.setStatus(String(params.id), 'archived')
    return HttpResponse.json({ id: params.id, status: 'archived' })
  }),

  // POST /me/comments/:id/unarchive — move back to unread
  http.post(`${BASE}/me/comments/:id/unarchive`, ({ params }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    commentInboxStore.setStatus(String(params.id), 'unread')
    return HttpResponse.json({ id: params.id, status: 'unread' })
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
    const items = filtered.slice(start, start + pageSize).map(withLicense)
    return HttpResponse.json({ items, total, page, page_size: pageSize })
  }),

  // GET /products/leaderboard — MUST be before /products/:slug
  // Supports ?period=daily|weekly|monthly|yearly &date=YYYY-MM-DD &filter=featured|all
  http.get(`${BASE}/products/leaderboard`, ({ request }) => {
    const url = new URL(request.url)
    const period = (url.searchParams.get('period') ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly'
    const dateStr = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
    const filter = url.searchParams.get('filter') ?? 'all'

    const target = new Date(dateStr + 'T12:00:00')
    const targetTime = target.getTime()

    const within = (created: string) => {
      const c = new Date(created).getTime()
      const diffDays = Math.floor((targetTime - c) / 86400000)
      if (diffDays < 0) return false
      if (period === 'daily') {
        // Same calendar date as `dateStr`
        return created.slice(0, 10) === dateStr
      }
      if (period === 'weekly') return diffDays < 7
      if (period === 'monthly') return diffDays < 30
      return diffDays < 365
    }

    let ranked = products.filter((p) => within(p.created_at))
    if (filter === 'featured') {
      // "Featured" = top half by votes within the period
      const sorted = [...ranked].sort((a, b) => b.vote_count - a.vote_count)
      ranked = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)))
    }
    ranked.sort((a, b) => b.vote_count - a.vote_count)

    return HttpResponse.json({ items: ranked.map(withLicense), period, date: dateStr, filter })
  }),

  // GET /products/archive — MUST be before /products/:slug
  http.get(`${BASE}/products/archive`, () => {
    const archived = [...products].sort((a, b) => b.vote_count - a.vote_count).map(withLicense)
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

    const license = (product as { license?: string }).license ?? productLicense(product.slug)
    const extras = productEditExtras.get(product.slug) ?? {}
    return HttpResponse.json({
      ...product,
      license: extras.license ?? license,
      source_url: 'source_url' in extras
        ? extras.source_url
        : (license === 'open-source' ? `https://github.com/launchedchit/${product.slug}` : null),
      description: extras.description ?? `${product.tagline}.\n\n${product.name} was built to solve a specific problem for the Gambian market. After months of working with users in Banjul, Brikama, and the rural Kombo areas, the team shipped a first version that focuses on three things: simplicity, offline reliability, and a price point that works for the market.\n\nThe team is small but committed — every feature you see has been requested by at least three real users. There's no growth-hacking, no fake testimonials, no "AI-powered" buzzwords thrown in for fundraising. Just a tool that works.\n\nWhat's next: we're rolling out support for additional regions, integrating with local payment providers, and (in beta) a partnership with two ministries to scale distribution.`,
      website_url: extras.website_url ?? `https://${product.slug.replace(/-/g, '')}.gm`,
      pricing: extras.pricing ?? 'Free during beta · Paid plans from D200/month',
      platforms: (product.platforms ?? ['web']).map((p) =>
        p === 'web' ? 'Web' : p === 'mobile' ? 'Mobile (iOS + Android)' : p === 'desktop' ? 'Desktop' : p
      ),
      platform_codes: product.platforms ?? ['web'],
      launch_date: '2026-04-26',
      day_rank: dayRank,
      maker: { id: 'user-001', name: product.maker.name, avatar_url: null, bio: `Building ${product.name} and other tools for The Gambia.`, username: product.maker.name.toLowerCase().replace(/\s+/g, '-') },
      ios_url: 'ios_url' in extras ? extras.ios_url : ((product.platforms ?? []).includes('mobile') ? 'https://apps.apple.com/gm/app/' + product.slug : null),
      android_url: 'android_url' in extras ? extras.android_url : ((product.platforms ?? []).includes('mobile') ? 'https://play.google.com/store/apps/details?id=gm.launchedchit.' + product.slug.replace(/-/g, '') : null),
      topics: product.topics ?? [],
      gallery: [
        { color: '#1E40AF', label: 'Dashboard' },
        { color: '#2563EB', label: 'Onboarding flow' },
        { color: '#3B82F6', label: 'Mobile app' },
        { color: '#60A5FA', label: 'Reports view' },
        { color: '#1D4ED8', label: 'Settings panel' },
      ],
      team: [
        { name: product.maker.name, role: 'Founder · CEO', avatar_color: '#2563EB', bio: 'Shipping for The Gambia' },
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
    return HttpResponse.json([...filtered].sort((a, b) => b.vote_count - a.vote_count).map(withLicense))
  }),

  // GET /profile/:username
  http.get(`${BASE}/profile/:username`, ({ params }) => {
    const username = String(params.username).toLowerCase()
    if (username === mockProfile.username) {
      return HttpResponse.json({ ...mockProfile, products: mockProfile.products.map(withLicense) })
    }

    // Generate a profile for any other maker that exists in mockProducts
    const productsByMaker = mockProducts.filter((p) => p.maker.name.toLowerCase().replace(/\s+/g, '-') === username)
    if (productsByMaker.length === 0) return new HttpResponse(null, { status: 404 })

    const name = productsByMaker[0].maker.name
    const totalUpvotes = productsByMaker.reduce((sum, p) => sum + p.vote_count, 0)
    const colors = ['#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309']
    const colorIdx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length

    const handle = name.toLowerCase().replace(/\s+/g, '')
    return HttpResponse.json({
      id: `user-${username}`,
      username,
      name,
      tagline: 'Gambian builder',
      bio: `Building products for The Gambia. Maker of ${productsByMaker.map((p) => p.name).join(', ')}.`,
      location: 'The Gambia',
      joined_at: '2025-01-15',
      avatar_url: null,
      cover_color: colors[colorIdx],
      website: `https://${handle}.gm`,
      github: `https://github.com/${handle}`,
      twitter: `https://twitter.com/${handle}`,
      linkedin: `https://linkedin.com/in/${handle}`,
      email: null,
      followers: Math.round(totalUpvotes * 1.3),
      following: 24,
      total_upvotes: totalUpvotes,
      products: productsByMaker.map(withLicense),
    })
  }),

  // PATCH /profile/me — update the signed-in user's profile.
  http.patch(`${BASE}/profile/me`, async ({ request }) => {
    if (!sessionActive) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as Partial<typeof mockProfile>
    if (typeof body.name === 'string' && body.name.trim()) mockProfile.name = body.name.trim()
    if (typeof body.tagline !== 'undefined') mockProfile.tagline = (body.tagline ?? '') as string
    if (typeof body.bio === 'string') mockProfile.bio = body.bio
    if (typeof body.location !== 'undefined') mockProfile.location = (body.location ?? '') as string
    if (typeof body.website !== 'undefined') mockProfile.website = body.website ?? null
    if (typeof body.github !== 'undefined') mockProfile.github = body.github ?? null
    if (typeof body.twitter !== 'undefined') mockProfile.twitter = body.twitter ?? null
    if (typeof body.linkedin !== 'undefined') mockProfile.linkedin = body.linkedin ?? null
    if (typeof body.email !== 'undefined') mockProfile.email = body.email ?? null
    if (typeof (body as { phone?: string | null }).phone !== 'undefined') {
      mockProfile.phone = (body as { phone?: string | null }).phone ?? null
    }
    return HttpResponse.json(mockProfile)
  }),

  // GET /profile/:username/analytics?period=30d|90d|1y
  http.get(`${BASE}/profile/:username/analytics`, ({ params, request }) => {
    const username = String(params.username).toLowerCase()
    const period = new URL(request.url).searchParams.get('period') ?? '30d'
    const days = period === '1y' ? 365 : period === '90d' ? 90 : 30

    let userProducts = mockProducts.filter((p) => p.maker.name.toLowerCase().replace(/\s+/g, '-') === username)
    if (username === mockProfile.username) userProducts = mockProducts.slice(0, 4)
    if (userProducts.length === 0) return new HttpResponse(null, { status: 404 })

    // Deterministic per-product time series: use product index in the seed.
    const series = userProducts.map((p, idx) => ({
      product_id: p.id,
      product_slug: p.slug,
      product_name: p.name,
      total_upvotes: p.vote_count,
      total_waitlist: p.waitlist_count ?? 0,
      upvotes_trend: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
        value: Math.max(0, Math.round(2 + Math.sin((i + idx * 5) / 4) * 3 + (i % 7))),
      })),
      waitlist_trend: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
        value: Math.max(0, Math.round(1 + Math.cos((i + idx * 3) / 5) * 2 + (i % 4))),
      })),
    }))

    const totals = series.reduce(
      (acc, s) => {
        acc.upvotes += s.total_upvotes
        acc.waitlist += s.total_waitlist
        return acc
      },
      { upvotes: 0, waitlist: 0 },
    )

    // Aggregate trend across all products for the headline charts.
    const aggregateUpvotes = Array.from({ length: days }, (_, i) => ({
      date: series[0].upvotes_trend[i].date,
      value: series.reduce((s, p) => s + p.upvotes_trend[i].value, 0),
    }))
    const aggregateWaitlist = Array.from({ length: days }, (_, i) => ({
      date: series[0].waitlist_trend[i].date,
      value: series.reduce((s, p) => s + p.waitlist_trend[i].value, 0),
    }))

    return HttpResponse.json({
      period,
      totals,
      aggregate_upvotes: aggregateUpvotes,
      aggregate_waitlist: aggregateWaitlist,
      products: series,
    })
  }),

  // GET /profile/:username/waitlist — list of people on the waitlists for this maker's products.
  http.get(`${BASE}/profile/:username/waitlist`, ({ params }) => {
    const username = String(params.username).toLowerCase()

    let userProducts = mockProducts.filter((p) => p.maker.name.toLowerCase().replace(/\s+/g, '-') === username)
    if (username === mockProfile.username) userProducts = mockProducts.slice(0, 4)
    if (userProducts.length === 0) return new HttpResponse(null, { status: 404 })

    // Deterministic fake signups so the page is stable across reloads.
    const firstNames = ['Awa', 'Modou', 'Fatou', 'Lamin', 'Isatou', 'Ousman', 'Mariama', 'Babucarr', 'Adama', 'Sulayman', 'Ndey', 'Pa Modou', 'Haddy', 'Ebrima', 'Aminata', 'Yusupha', 'Fatim', 'Saikou', 'Binta', 'Dawda']
    const lastNames = ['Jallow', 'Touray', 'Ceesay', 'Bah', 'Ndoye', 'Sanyang', 'Saine', 'Joof', 'Drammeh', 'Manneh', 'Singhateh', 'Camara', 'Kah', 'Mboge', 'Faal', 'Sowe', 'Dibba', 'Sanneh', 'Jatta', 'Suso']
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'qcell.gm', 'africell.gm']
    const sources: Array<'organic' | 'referral' | 'twitter' | 'newsletter'> = ['organic', 'referral', 'twitter', 'newsletter']

    const groups = userProducts.map((p, pi) => {
      const total = p.waitlist_count ?? 0
      const shown = Math.min(total, 50)
      const signups = Array.from({ length: shown }, (_, i) => {
        const seed = pi * 31 + i
        const first = firstNames[seed % firstNames.length]
        const last = lastNames[(seed * 7) % lastNames.length]
        const domain = domains[(seed * 3) % domains.length]
        const handle = `${first.toLowerCase().replace(/\s+/g, '')}.${last.toLowerCase()}`
        const hasPhone = (seed % 3) === 0
        const phoneTail = String(7000000 + ((seed * 991) % 999999)).padStart(7, '0')
        return {
          id: `wl-${p.id}-${i}`,
          name: `${first} ${last}`,
          email: `${handle}@${domain}`,
          phone: hasPhone ? `+220 ${phoneTail.slice(0, 3)} ${phoneTail.slice(3)}` : null,
          source: sources[seed % sources.length],
          joined_at: new Date(Date.now() - ((i * 86400000) + (pi * 3600000))).toISOString(),
        }
      })
      return {
        product_id: p.id,
        product_slug: p.slug,
        product_name: p.name,
        total,
        signups,
      }
    })

    const totalAll = groups.reduce((s, g) => s + g.total, 0)
    return HttpResponse.json({ total: totalAll, products: groups })
  }),

  // GET /community/categories
  http.get(`${BASE}/community/categories`, () => {
    const withCounts = mockForumCategories.map((c) => ({
      ...c,
      thread_count: mockThreads.filter((t) => t.category === c.slug).length,
    }))
    return HttpResponse.json(withCounts)
  }),

  // GET /community/product-forums
  http.get(`${BASE}/community/product-forums`, () => {
    const slugSet = new Set(mockThreads.map((t) => t.product_slug).filter(Boolean) as string[])
    const forums = Array.from(slugSet).map((slug) => {
      const product = products.find((p) => p.slug === slug)!
      return {
        slug,
        name: product.name,
        thread_count: mockThreads.filter((t) => t.product_slug === slug).length,
        topics: product.topics ?? [],
      }
    })
    return HttpResponse.json(forums)
  }),

  // GET /community/threads — supports ?category=&product=&sort=
  http.get(`${BASE}/community/threads`, ({ request }) => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const product = url.searchParams.get('product')
    const sort = url.searchParams.get('sort') ?? 'recent'

    let threads = [...mockThreads]
    if (category) threads = threads.filter((t) => t.category === category)
    if (product) threads = threads.filter((t) => t.product_slug === product)

    if (sort === 'popular') threads.sort((a, b) => b.upvotes - a.upvotes)
    // 'recent' is the default order in the mock data

    return HttpResponse.json(threads)
  }),

  // GET /community/threads/:id — MUST be before generic threads handler? No — it's /threads/:id vs /threads,
  // so the route patterns are distinct enough; but we keep it above for safety.
  http.get(`${BASE}/community/threads/:id`, ({ params }) => {
    const thread = mockThreads.find((t) => t.id === params.id)
    if (!thread) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(thread)
  }),

  // POST /community/threads/:id/follow — toggle follow
  http.post(`${BASE}/community/threads/:id/follow`, ({ params }) => {
    const thread = mockThreads.find((t) => t.id === params.id)
    if (!thread) return new HttpResponse(null, { status: 404 })
    thread.follower_count += 1
    return HttpResponse.json({ follower_count: thread.follower_count, following: true })
  }),

  // GET /community/events  — supports ?view=grid|calendar &month=YYYY-MM &page=&page_size=&mode=
  http.get(`${BASE}/community/events`, ({ request }) => {
    const url = new URL(request.url)
    const view = url.searchParams.get('view') ?? 'grid'
    const month = url.searchParams.get('month')
    const mode = url.searchParams.get('mode')

    let list = [...mockEvents]
    if (mode && mode !== 'all') list = list.filter((e) => e.mode.toLowerCase().replace(' ', '-') === mode)
    if (view === 'calendar' && month) {
      const filtered = list.filter((e) => e.start.slice(0, 7) === month)
      filtered.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      return HttpResponse.json({ items: filtered, total: filtered.length, view, month })
    }

    // Grid view → paginated
    list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
    const pageSize = Math.max(1, Number(url.searchParams.get('page_size') ?? '6'))
    const start = (page - 1) * pageSize
    return HttpResponse.json({
      items: list.slice(start, start + pageSize),
      total: list.length,
      page,
      page_size: pageSize,
      view,
    })
  }),

  // GET /community/events/:id
  http.get(`${BASE}/community/events/:id`, ({ params }) => {
    const event = mockEvents.find((e) => e.id === params.id || e.slug === params.id)
    if (!event) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(event)
  }),

  // GET /community/requests — supports ?sort=&page=&page_size=
  http.get(`${BASE}/community/requests`, ({ request }) => {
    const url = new URL(request.url)
    const sort = url.searchParams.get('sort') ?? 'popular'
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
    const pageSize = Math.max(1, Number(url.searchParams.get('page_size') ?? '10'))
    const list = [...mockRequests]
    if (sort === 'popular') list.sort((a, b) => b.upvotes - a.upvotes)
    const start = (page - 1) * pageSize
    return HttpResponse.json({
      items: list.slice(start, start + pageSize),
      total: list.length,
      page,
      page_size: pageSize,
    })
  }),

  // POST /community/requests — create a new product request
  http.post(`${BASE}/community/requests`, async ({ request }) => {
    const body = (await request.json()) as {
      title?: string
      body?: string
      audience?: string | null
      requester_name?: string
      requester_email?: string | null
      requester_phones?: string[]
      would_pay?: boolean
      pay_amount?: number | null
      pay_currency?: 'GMD' | 'USD' | null
    }
    if (!body.title || !body.body || !body.requester_name) {
      return new HttpResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }
    const id = `r-${Date.now().toString(36)}`
    const created = {
      id,
      title: body.title.trim(),
      body: body.body.trim(),
      requester: { name: body.requester_name.trim() },
      upvotes: body.would_pay ? 1 : 0,
      responses: 0,
      status: 'open' as const,
      created_at: 'just now',
    }
    mockRequests.unshift(created)
    requestExtras.set(id, {
      audience: body.audience ?? null,
      requester_email: body.requester_email ?? null,
      requester_phones: (body.requester_phones ?? []).filter((p) => p && p.trim()).slice(0, 2),
      pay_pledges: body.would_pay && body.pay_amount
        ? [{ amount: body.pay_amount, currency: (body.pay_currency ?? 'GMD') as 'GMD' | 'USD' }]
        : [],
    })
    return HttpResponse.json(created, { status: 201 })
  }),

  // GET /community/requests/:id — full detail with audience, pay summary, makers, responses
  http.get(`${BASE}/community/requests/:id`, ({ params }) => {
    const r = mockRequests.find((x) => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })

    const extras = requestExtras.get(r.id)
    const seed = r.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

    // Audience: from creator-supplied extras when available, else generated.
    const audiencePool = [
      'Osusu organisers and small chama groups',
      'Daily commuters in the Greater Banjul Area',
      'Land buyers, lawyers, and surveyors',
      'Diaspora and observant Muslims abroad',
      'Voters across all seven regions',
      'Wedding planners, families, and event organisers',
      'Accountants, small businesses, and tax consultants',
    ]
    const audience = extras?.audience ?? audiencePool[seed % audiencePool.length]

    // Pay pledges: combine user-submitted pledges with deterministic mocks.
    const generatedPledges = Array.from({ length: Math.min(8, Math.max(0, Math.floor(r.upvotes / 25))) }, (_, i) => ({
      amount: 100 + ((seed + i * 37) % 9) * 50,
      currency: (i % 4 === 0 ? 'USD' : 'GMD') as 'GMD' | 'USD',
    }))
    const allPledges = [...(extras?.pay_pledges ?? []), ...generatedPledges]
    const gmdPledges = allPledges.filter((p) => p.currency === 'GMD')
    const usdPledges = allPledges.filter((p) => p.currency === 'USD')
    const pay_summary = allPledges.length === 0 ? null : {
      supporters: allPledges.length,
      gmd_avg: gmdPledges.length ? Math.round(gmdPledges.reduce((s, p) => s + p.amount, 0) / gmdPledges.length) : 0,
      usd_avg: usdPledges.length ? Math.round(usdPledges.reduce((s, p) => s + p.amount, 0) / usdPledges.length) : 0,
      gmd_count: gmdPledges.length,
      usd_count: usdPledges.length,
    }

    // Makers interested: deterministic slice from a builder pool.
    const makerPool = [
      { name: 'Musa Jallow',     username: 'musa-jallow',     avatar_color: '#2563EB', note: 'Already prototyping a v0 — ping me.' },
      { name: 'Awa Touray',      username: 'awa-touray',      avatar_color: '#0891B2', note: 'Could ship this in 2 weekends.' },
      { name: 'Lamin Saho',      username: 'lamin-saho',      avatar_color: '#1D4ED8', note: 'Interested if we can get 50 paying users.' },
      { name: 'Fatou Ceesay',    username: 'fatou-ceesay',    avatar_color: '#06B6D4', note: 'Has the SMS rails for this.' },
      { name: 'Modou Jatta',     username: 'modou-jatta',     avatar_color: '#3B82F6' },
      { name: 'Binta Ceesay',    username: 'binta-ceesay',    avatar_color: '#0E7490' },
      { name: 'Pa Modou Faal',   username: 'pa-modou-faal',   avatar_color: '#1E40AF' },
    ]
    const interested_makers = makerPool.slice(0, Math.min(makerPool.length, r.responses))

    // Responses (lightweight discussion thread)
    const responseTemplates = [
      'Looked into this last quarter — happy to share what I learned.',
      'I think the hardest part is distribution, not the build.',
      'Has anyone validated this with actual users yet?',
      'I would absolutely use this. Take my money.',
      'Available on web AND offline-first SMS would be the dream.',
      'Could pair on a v0 if anyone is interested.',
    ]
    const responses_list = Array.from({ length: r.responses }, (_, i) => ({
      id: `${r.id}-c${i + 1}`,
      author: makerPool[(seed + i) % makerPool.length].name,
      avatar_color: makerPool[(seed + i) % makerPool.length].avatar_color,
      body: responseTemplates[(seed + i * 11) % responseTemplates.length],
      created_at: `${i + 1} day${i === 0 ? '' : 's'} ago`,
    }))

    // 3 related requests by status, excluding current
    const related = mockRequests.filter((x) => x.id !== r.id).slice(0, 3).map((x) => ({
      id: x.id, title: x.title, upvotes: x.upvotes, status: x.status,
    }))

    return HttpResponse.json({
      ...r,
      audience,
      requester_email: extras?.requester_email ?? null,
      requester_phones: extras?.requester_phones ?? [],
      pay_summary,
      interested_makers,
      responses_list,
      related,
    })
  }),

  // POST /community/requests/:id/interested — maker signals "I'd build this"
  http.post(`${BASE}/community/requests/:id/interested`, ({ params }) => {
    const r = mockRequests.find((x) => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    r.responses += 1
    return HttpResponse.json({ responses: r.responses })
  }),

  // POST /community/requests/:id/upvote — increment upvote
  http.post(`${BASE}/community/requests/:id/upvote`, ({ params }) => {
    const req = mockRequests.find((r) => r.id === params.id)
    if (!req) return new HttpResponse(null, { status: 404 })
    req.upvotes += 1
    return HttpResponse.json({ upvotes: req.upvotes })
  }),

  // POST /community/subscribe — newsletter
  http.post(`${BASE}/community/subscribe`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; topics?: string[] }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return new HttpResponse(JSON.stringify({ error: 'Invalid email' }), { status: 400 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
