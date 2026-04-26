import { useEffect, useState } from 'react'

const STORAGE_KEY = 'launchedchit:cookie-consent:v2'

type Preferences = {
  necessary: true
  functional: boolean
  analytics: boolean
  marketing: boolean
  timestamp: string
}

function loadStored(): Preferences | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed && parsed.timestamp) return parsed as Preferences
    return null
  } catch {
    return null
  }
}

function persist(prefs: Preferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {}
}

const cookieCategories = [
  {
    key: 'necessary' as const,
    label: 'Strictly necessary',
    required: true,
    body: 'Required for the site to work. Includes session, authentication, security, and preferences you have explicitly set. Cannot be turned off.',
  },
  {
    key: 'functional' as const,
    label: 'Functional',
    required: false,
    body: 'Remember choices you make to give you a better experience — language, region, recently viewed products, and saved filters.',
  },
  {
    key: 'analytics' as const,
    label: 'Analytics',
    required: false,
    body: 'Help us understand which features are used and where people get stuck. Aggregated and never sold.',
  },
  {
    key: 'marketing' as const,
    label: 'Marketing',
    required: false,
    body: 'Used to measure the effectiveness of campaigns and to show you relevant content on other sites. None of this is shared with third parties without consent.',
  },
]

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [prefs, setPrefs] = useState<Omit<Preferences, 'timestamp'>>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    if (loadStored() === null) setVisible(true)
  }, [])

  function save(next: Omit<Preferences, 'timestamp'>) {
    const full: Preferences = { ...next, necessary: true, timestamp: new Date().toISOString() }
    persist(full)
    setVisible(false)
    setShowDetails(false)
  }

  function acceptAll() {
    save({ necessary: true, functional: true, analytics: true, marketing: true })
  }

  function rejectAll() {
    save({ necessary: true, functional: false, analytics: false, marketing: false })
  }

  function saveCustom() {
    save(prefs)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop dim only when details modal is open */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-black/40 z-[89]"
          onClick={() => setShowDetails(false)}
          aria-hidden
        />
      )}

      <div
        role="dialog"
        aria-modal={showDetails ? 'true' : 'false'}
        aria-live="polite"
        aria-label="Cookie consent"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-7xl z-[90]"
      >
        <div
          className="bg-surface border border-border rounded-card overflow-hidden"
          style={{ boxShadow: '0 16px 40px -8px rgb(0 0 0 / 0.3)' }}
        >
          {!showDetails ? (
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden>
                    <path d="M21.598 11.064a1.006 1.006 0 0 0-.854-.85 4.137 4.137 0 0 1-3.515-3.515 1.006 1.006 0 0 0-.85-.854 4.143 4.143 0 0 1-3.408-3.408 1.006 1.006 0 0 0-1.27-.798 9 9 0 1 0 9.895 9.895 1 1 0 0 0 .002-.47Z" />
                    <circle cx="9" cy="14" r="1" /><circle cx="15" cy="15" r="1" /><circle cx="8" cy="9" r="1" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-foreground">Your privacy choices</p>
                  <p className="text-sm text-foreground-muted mt-1.5 leading-relaxed">
                    LaunchedChit uses cookies and similar technologies to keep you signed in, remember your preferences,
                    measure how the site is used, and — with your consent — show you relevant content. You can accept all,
                    reject everything that isn't strictly necessary, or pick what you're comfortable with. You can change
                    your choice at any time from the footer. See our{' '}
                    <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>{' '}
                    and{' '}
                    <a href="/cookies" className="text-primary hover:underline font-medium">Cookie Policy</a>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="text-sm font-semibold py-2.5 rounded-button border border-border bg-surface text-foreground hover:border-border-strong transition-colors"
                >
                  Customize
                </button>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="text-sm font-semibold py-2.5 rounded-button border border-border bg-surface text-foreground hover:border-border-strong transition-colors"
                >
                  Reject all
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="text-sm font-semibold py-2.5 rounded-button bg-accent text-white hover:bg-accent-dark transition-colors"
                >
                  Accept all
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-bold text-foreground">Manage cookie preferences</p>
                    <p className="text-sm text-foreground-muted mt-1">
                      Choose which categories you want to enable. Strictly necessary cookies are always on.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    aria-label="Close"
                    className="text-foreground-faint hover:text-foreground p-1 -m-1"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="max-h-[55vh] overflow-y-auto">
                {cookieCategories.map((cat) => {
                  const checked = cat.required ? true : prefs[cat.key]
                  return (
                    <div key={cat.key} className="px-6 py-4 border-b border-border last:border-b-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                            {cat.required && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-subtle text-foreground-muted border border-border">
                                Always active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground-muted mt-1.5 leading-relaxed">{cat.body}</p>
                        </div>
                        <label className={`relative inline-flex items-center flex-shrink-0 ${cat.required ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={cat.required}
                            onChange={(e) => {
                              if (cat.required) return
                              setPrefs((p) => ({ ...p, [cat.key]: e.target.checked }))
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-border rounded-full peer-checked:bg-primary transition-colors" />
                          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-6 py-4 bg-surface-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-foreground-faint">
                  Read our{' '}
                  <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>{' '}
                  and{' '}
                  <a href="/cookies" className="text-primary hover:underline font-medium">Cookie Policy</a>.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="flex-1 sm:flex-none text-sm font-semibold py-2 px-4 rounded-button border border-border bg-surface text-foreground hover:border-border-strong transition-colors"
                  >
                    Reject all
                  </button>
                  <button
                    type="button"
                    onClick={saveCustom}
                    className="flex-1 sm:flex-none text-sm font-semibold py-2 px-4 rounded-button bg-primary text-white hover:bg-primary-light transition-colors"
                  >
                    Save preferences
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="flex-1 sm:flex-none text-sm font-semibold py-2 px-4 rounded-button bg-accent text-white hover:bg-accent-dark transition-colors"
                  >
                    Accept all
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
