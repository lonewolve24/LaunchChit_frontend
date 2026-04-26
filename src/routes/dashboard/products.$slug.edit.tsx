import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { PageError } from '../../components/PageError'
import { Toast } from '../../components/Toast'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

export const Route = createFileRoute('/dashboard/products/$slug/edit')({ component: ProductEditPage })

type Product = {
  slug: string
  name: string
  tagline: string
  description: string
  logo_url: string | null
  website_url: string
  pricing: string
  license: 'open-source' | 'commercial' | 'free'
  platform_codes: Array<'web' | 'mobile' | 'desktop'>
  ios_url: string | null
  android_url: string | null
  source_url: string | null
}

const PLATFORMS: Array<{ value: 'web' | 'mobile' | 'desktop'; label: string }> = [
  { value: 'web',     label: 'Web' },
  { value: 'mobile',  label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
]

const LICENSES: Array<{ value: Product['license']; label: string; hint: string }> = [
  { value: 'open-source', label: 'Open source', hint: 'Source publicly available under an OSS license.' },
  { value: 'commercial',  label: 'Commercial',  hint: 'Paid product or paid plans.' },
  { value: 'free',        label: 'Free',        hint: 'Free to use; not open source.' },
]

function isValidUrlOrEmpty(v: string): boolean {
  if (!v.trim()) return true
  try { new URL(v); return true } catch { return false }
}

function ProductEditPage() {
  const { slug } = useParams({ from: '/dashboard/products/$slug/edit' })
  const navigate = useNavigate()

  const [original, setOriginal] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [pricing, setPricing] = useState('')
  const [license, setLicense] = useState<Product['license']>('free')
  const [platforms, setPlatforms] = useState<Set<'web' | 'mobile' | 'desktop'>>(new Set(['web']))
  const [iosUrl, setIosUrl] = useState('')
  const [androidUrl, setAndroidUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/products/${slug}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => {
        if (!data || cancelled) return
        const p: Product = {
          slug: data.slug,
          name: data.name,
          tagline: data.tagline,
          description: data.description ?? '',
          logo_url: data.logo_url ?? null,
          website_url: data.website_url ?? '',
          pricing: data.pricing ?? '',
          license: data.license ?? 'free',
          platform_codes: data.platform_codes ?? data.platforms ?? ['web'],
          ios_url: data.ios_url ?? null,
          android_url: data.android_url ?? null,
          source_url: data.source_url ?? null,
        }
        setOriginal(p)
        setName(p.name)
        setTagline(p.tagline)
        setDescription(p.description)
        setWebsiteUrl(p.website_url)
        setLogoUrl(p.logo_url)
        setPricing(p.pricing)
        setLicense(p.license)
        setPlatforms(new Set(p.platform_codes))
        setIosUrl(p.ios_url ?? '')
        setAndroidUrl(p.android_url ?? '')
        setSourceUrl(p.source_url ?? '')
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  function togglePlatform(p: 'web' | 'mobile' | 'desktop') {
    setPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  async function handleSave() {
    if (!name.trim()) { setError('Product name is required.'); return }
    if (!tagline.trim()) { setError('Tagline is required.'); return }
    if (!description.trim() || description.trim().length < 30) { setError('Description should be at least 30 characters.'); return }
    if (!isValidUrlOrEmpty(websiteUrl)) { setError('Website URL is not a valid URL.'); return }
    if (!isValidUrlOrEmpty(iosUrl)) { setError('iOS URL is not a valid URL.'); return }
    if (!isValidUrlOrEmpty(androidUrl)) { setError('Android URL is not a valid URL.'); return }
    if (!isValidUrlOrEmpty(sourceUrl)) { setError('Source URL is not a valid URL.'); return }
    if (platforms.size === 0) { setError('Pick at least one platform.'); return }

    setError(null)
    setSaving(true)
    const res = await fetch(`${API}/me/products/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        website_url: websiteUrl.trim(),
        logo_url: logoUrl,
        pricing: pricing.trim(),
        license,
        platforms: Array.from(platforms),
        ios_url: iosUrl.trim() || null,
        android_url: androidUrl.trim() || null,
        source_url: sourceUrl.trim() || null,
      }),
    })
    setSaving(false)
    if (!res.ok) { setError('Could not save changes. Try again.'); return }
    setToast({ message: 'Changes saved.', variant: 'success' })
  }

  function handleCancel() {
    navigate({ to: '/dashboard/products', search: { status: '', page: 1 } })
  }

  if (notFound) return <PageError status={404} message="That product doesn't exist (or isn't yours)." />

  if (loading || !original) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <a href="/dashboard/products" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to my products
        </a>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Edit {original.name}</h1>
          <p className="text-foreground-muted mt-1">Updates appear on the public product page immediately.</p>
        </div>
      </header>

      {/* Basics */}
      <section className="bg-surface rounded-card p-6 space-y-4" style={{ boxShadow: cardShadow }}>
        <h2 className="text-base font-bold text-foreground">The basics</h2>
        <Field label="Product name" id="name" value={name} onChange={setName} maxLength={80} />
        <Field label="Tagline" id="tagline" value={tagline} onChange={setTagline} maxLength={80} hint="One sentence pitch." />
        <Field label="Description" id="description" value={description} onChange={setDescription} maxLength={2000} textarea hint="Tell the story — what it does, who it's for, what's next." />
        <Field label="Website URL" id="website_url" value={websiteUrl} onChange={setWebsiteUrl} type="url" placeholder="https://" />
        <Field label="Logo URL" id="logo_url" value={logoUrl ?? ''} onChange={(v) => setLogoUrl(v || null)} type="url" placeholder="https://" optional hint="Square image, ideally ≥ 256px." />
      </section>

      {/* Platforms */}
      <section className="bg-surface rounded-card p-6 space-y-4" style={{ boxShadow: cardShadow }}>
        <h2 className="text-base font-bold text-foreground">Platforms</h2>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = platforms.has(p.value)
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePlatform(p.value)}
                aria-pressed={active}
                className={`text-sm font-semibold px-4 py-2 rounded-button border-2 transition-colors cursor-pointer ${
                  active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface text-foreground hover:border-border-strong'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        {platforms.has('mobile') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <Field label="iOS App Store URL" id="ios_url" value={iosUrl} onChange={setIosUrl} type="url" optional placeholder="https://apps.apple.com/…" />
            <Field label="Google Play URL" id="android_url" value={androidUrl} onChange={setAndroidUrl} type="url" optional placeholder="https://play.google.com/…" />
          </div>
        )}
      </section>

      {/* Pricing & license */}
      <section className="bg-surface rounded-card p-6 space-y-4" style={{ boxShadow: cardShadow }}>
        <h2 className="text-base font-bold text-foreground">Pricing & license</h2>
        <Field label="Pricing summary" id="pricing" value={pricing} onChange={setPricing} maxLength={120} optional hint="e.g. Free during beta · Paid plans from D200/month" />
        <div>
          <span className="text-sm font-medium text-foreground">License</span>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            {LICENSES.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLicense(l.value)}
                aria-pressed={license === l.value}
                className={`text-left p-3 rounded-card border-2 transition-colors cursor-pointer ${
                  license === l.value ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-border-strong'
                }`}
              >
                <span className="text-sm font-bold text-foreground block">{l.label}</span>
                <span className="text-xs text-foreground-muted block mt-0.5">{l.hint}</span>
              </button>
            ))}
          </div>
        </div>
        {license === 'open-source' && (
          <Field label="Source repository URL" id="source_url" value={sourceUrl} onChange={setSourceUrl} type="url" optional placeholder="https://github.com/…" />
        )}
      </section>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-surface-subtle py-3 -mx-1 px-1">
        <a
          href={`/p/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-foreground-muted hover:text-foreground"
        >
          View public page →
        </a>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCancel} className="text-sm font-semibold px-4 py-2 rounded-button text-foreground-muted hover:text-foreground cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-white text-sm font-semibold px-5 py-2 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

type FieldProps = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  optional?: boolean
  textarea?: boolean
  type?: string
  maxLength?: number
  hint?: string
  placeholder?: string
}

function Field({ id, label, value, onChange, optional, textarea, type = 'text', maxLength, hint, placeholder }: FieldProps) {
  const inputClass = 'w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors'
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}{optional && <span className="text-foreground-faint ml-1 font-normal">(optional)</span>}
        </label>
        {maxLength && <span className="text-xs text-foreground-faint">{value.length} / {maxLength}</span>}
      </div>
      {hint && <p className="text-xs text-foreground-muted mt-0.5 mb-1">{hint}</p>}
      {textarea ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} rows={6} className={`${inputClass} mt-1 resize-y`} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} className={`${inputClass} mt-1`} />
      )}
    </div>
  )
}
