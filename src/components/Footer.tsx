const discover = [
  { label: "Today's Launches", href: '/' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Topics', href: '/topics' },
  { label: 'Archive', href: '/archive' },
  { label: 'Community', href: '/community' },
]

const topics = [
  { label: 'Fintech', href: '/topics/fintech' },
  { label: 'Agri-Tech', href: '/topics/agri-tech' },
  { label: 'EdTech', href: '/topics/edtech' },
  { label: 'HealthTech', href: '/topics/healthtech' },
  { label: 'Logistics', href: '/topics/logistics' },
  { label: 'E-commerce', href: '/topics/ecommerce' },
  { label: 'Gov Tech', href: '/topics/govtech' },
  { label: 'Social', href: '/topics/social' },
]

const company = [
  { label: 'Submit a Product', href: '/submit' },
  { label: 'About', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#0F2D20' }} className="mt-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="/" className="text-white font-bold text-xl tracking-tight">
              LaunchedChit
            </a>
            <p className="text-white/50 text-sm mt-3 leading-relaxed max-w-xs">
              A daily feed of products built by Gambian makers. Ship something. Get seen. Built for The Gambia 🇬🇲
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                aria-label="Twitter / X"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/70">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                aria-label="GitHub"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/70">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Discover */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Discover</h4>
            <ul className="space-y-2.5">
              {discover.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/50 text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Topics</h4>
            <ul className="space-y-2.5">
              {topics.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/50 text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              {company.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/50 text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/30 text-xs">© {new Date().getFullYear()} LaunchedChit. All rights reserved.</p>
            <p className="text-white/30 text-xs">Made with ❤️ for Gambian builders</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
