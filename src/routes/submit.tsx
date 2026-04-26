import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { InlineError } from '../components/InlineError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/submit')({ component: SubmitPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Platform = 'web' | 'mobile' | 'desktop'
type License = 'open-source' | 'commercial'

type GalleryImage = { url: string; label: string }
type BuiltWithItem = { name: string; description: string }
type TeamMember = { name: string; role: string; bio: string }

type Fields = {
  name: string
  tagline: string
  description: string
  website_url: string
  logo_url: string
  topics: string[]
  license: License
  platforms: Platform[]
  ios_url: string
  android_url: string
  source_url: string
  pricing: string
  gallery: GalleryImage[]
  built_with: BuiltWithItem[]
  team: TeamMember[]
}

type Errors = Partial<Record<keyof Fields | 'submit', string>>

const TOPIC_OPTIONS: Array<{ slug: string; name: string }> = [
  { slug: 'fintech',    name: 'Fintech' },
  { slug: 'agri-tech',  name: 'Agri-Tech' },
  { slug: 'edtech',     name: 'EdTech' },
  { slug: 'healthtech', name: 'HealthTech' },
  { slug: 'logistics',  name: 'Logistics' },
  { slug: 'ecommerce',  name: 'E-commerce' },
  { slug: 'govtech',    name: 'Gov Tech' },
  { slug: 'social',     name: 'Social' },
]

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string; icon: string }> = [
  { value: 'web',     label: 'Web app',     icon: '🌐' },
  { value: 'mobile',  label: 'Mobile app',  icon: '📱' },
  { value: 'desktop', label: 'Desktop app', icon: '💻' },
]

function isValidUrl(s: string): boolean {
  if (!s.trim()) return false
  try { new URL(s); return true } catch { return false }
}

function validate(f: Fields): Errors {
  const errors: Errors = {}
  if (!f.name.trim()) errors.name = 'Product name is required.'
  if (!f.tagline.trim()) errors.tagline = 'Tagline is required.'
  if (!f.description.trim()) errors.description = 'Description is required.'
  if (!f.website_url.trim()) errors.website_url = 'Website URL is required.'
  else if (!isValidUrl(f.website_url)) errors.website_url = 'Enter a valid URL.'
  if (f.logo_url.trim() && !isValidUrl(f.logo_url)) errors.logo_url = 'Enter a valid URL.'
  if (f.topics.length === 0) errors.topics = 'Pick at least one topic.'
  if (f.platforms.length === 0) errors.platforms = 'Pick at least one platform.'
  if (f.platforms.includes('mobile') && !f.ios_url.trim() && !f.android_url.trim()) {
    errors.ios_url = 'Add at least one app store URL when mobile is selected.'
  }
  if (f.ios_url.trim() && !isValidUrl(f.ios_url)) errors.ios_url = 'Enter a valid URL.'
  if (f.android_url.trim() && !isValidUrl(f.android_url)) errors.android_url = 'Enter a valid URL.'
  if (f.license === 'open-source' && !f.source_url.trim()) {
    errors.source_url = 'Open-source projects need a public source URL.'
  }
  if (f.source_url.trim() && !isValidUrl(f.source_url)) errors.source_url = 'Enter a valid URL.'
  return errors
}

const EMPTY_FIELDS: Fields = {
  name: '', tagline: '', description: '', website_url: '', logo_url: '',
  topics: [], license: 'commercial', platforms: [],
  ios_url: '', android_url: '', source_url: '', pricing: '',
  gallery: [], built_with: [], team: [],
}

export function SubmitPage() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/me`, { credentials: 'include' }).then((r) => {
      if (r.status === 401) { window.location.href = '/login?next=/submit'; return }
      setAuthChecked(true)
    }).catch(() => setAuthChecked(true))
  }, [])

  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  function setText(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(key, e.target.value as Fields[typeof key])
  }

  function toggleTopic(slug: string) {
    setField('topics', fields.topics.includes(slug)
      ? fields.topics.filter((s) => s !== slug)
      : [...fields.topics, slug])
  }

  function togglePlatform(p: Platform) {
    setField('platforms', fields.platforms.includes(p)
      ? fields.platforms.filter((x) => x !== p)
      : [...fields.platforms, p])
  }

  // List helpers
  function addRow<K extends 'gallery' | 'built_with' | 'team'>(key: K, empty: Fields[K][number]) {
    setField(key, [...(fields[key] as Array<typeof empty>), empty] as Fields[K])
  }
  function updateRow<K extends 'gallery' | 'built_with' | 'team'>(key: K, i: number, patch: Partial<Fields[K][number]>) {
    const list = [...(fields[key] as Array<Fields[K][number]>)]
    list[i] = { ...list[i], ...patch }
    setField(key, list as Fields[K])
  }
  function removeRow<K extends 'gallery' | 'built_with' | 'team'>(key: K, i: number) {
    setField(key, (fields[key] as Array<Fields[K][number]>).filter((_, idx) => idx !== i) as Fields[K])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const payload = {
      ...fields,
      logo_url: fields.logo_url || null,
      ios_url: fields.ios_url || null,
      android_url: fields.android_url || null,
      source_url: fields.source_url || null,
    }

    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (res.status === 401) { window.location.href = '/login?next=/submit'; return }

    if (res.ok) {
      const { slug } = await res.json()
      navigate({ to: '/p/$slug', params: { slug } })
    } else {
      setToast('Could not submit product. Please try again.')
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center">
        <span role="status" className="text-sm text-foreground-muted">Loading…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />
      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Share something</h1>
        <p className="text-foreground-muted mt-1">The more detail you provide, the richer your product page will look.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-10">
          {/* Basics */}
          <Section title="The basics" subtitle="What it is and where to find it.">
            <Field label="Product name" id="name" maxLength={80} value={fields.name} onChange={setText('name')} error={errors.name} />
            <Field label="Tagline" id="tagline" maxLength={120} value={fields.tagline} onChange={setText('tagline')} error={errors.tagline} hint="One line. What does it do?" />
            <Field label="Description" id="description" maxLength={2000} value={fields.description} onChange={setText('description')} error={errors.description} textarea />
            <Field label="Website URL" id="website_url" value={fields.website_url} onChange={setText('website_url')} error={errors.website_url} type="url" />
            <Field label="Logo URL" id="logo_url" value={fields.logo_url} onChange={setText('logo_url')} error={errors.logo_url} type="url" optional hint="Square image, ideally 256×256." />
          </Section>

          {/* Categorisation */}
          <Section title="Categorisation" subtitle="Helps people find your product on topic and platform pages.">
            <Fieldset legend="Topics" error={errors.topics} hint="Pick all that apply.">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TOPIC_OPTIONS.map((t) => {
                  const checked = fields.topics.includes(t.slug)
                  return (
                    <label key={t.slug} className={`flex items-center gap-2 px-3 py-2 rounded-button border cursor-pointer text-sm transition-colors ${checked ? 'border-primary bg-primary-muted text-primary' : 'border-border bg-surface text-foreground-muted hover:border-border-strong'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleTopic(t.slug)} className="sr-only" />
                      {t.name}
                    </label>
                  )
                })}
              </div>
            </Fieldset>

            <Fieldset legend="License">
              <div className="grid grid-cols-2 gap-2">
                {(['commercial', 'open-source'] as License[]).map((l) => {
                  const checked = fields.license === l
                  const label = l === 'open-source' ? 'Open source' : 'Commercial'
                  return (
                    <label key={l} className={`flex items-center gap-2 px-3 py-2 rounded-button border cursor-pointer text-sm transition-colors ${checked ? 'border-primary bg-primary-muted text-primary' : 'border-border bg-surface text-foreground-muted hover:border-border-strong'}`}>
                      <input type="radio" name="license" checked={checked} onChange={() => setField('license', l)} className="sr-only" />
                      {label}
                    </label>
                  )
                })}
              </div>
            </Fieldset>

            <Fieldset legend="Platforms" error={errors.platforms} hint="Where can people use this?">
              <div className="grid grid-cols-3 gap-2">
                {PLATFORM_OPTIONS.map((p) => {
                  const checked = fields.platforms.includes(p.value)
                  return (
                    <label key={p.value} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-button border cursor-pointer text-sm transition-colors ${checked ? 'border-primary bg-primary-muted text-primary' : 'border-border bg-surface text-foreground-muted hover:border-border-strong'}`}>
                      <input type="checkbox" checked={checked} onChange={() => togglePlatform(p.value)} className="sr-only" />
                      <span aria-hidden>{p.icon}</span>
                      {p.label}
                    </label>
                  )
                })}
              </div>
            </Fieldset>
          </Section>

          {/* Mobile-conditional */}
          {fields.platforms.includes('mobile') && (
            <Section title="App store links" subtitle="Show download buttons on your product page.">
              <Field label="iOS App Store URL" id="ios_url" value={fields.ios_url} onChange={setText('ios_url')} error={errors.ios_url} type="url" optional />
              <Field label="Google Play URL" id="android_url" value={fields.android_url} onChange={setText('android_url')} error={errors.android_url} type="url" optional />
            </Section>
          )}

          {/* Open-source-conditional */}
          {fields.license === 'open-source' && (
            <Section title="Source code" subtitle="Required for open-source projects.">
              <Field label="Public source URL" id="source_url" value={fields.source_url} onChange={setText('source_url')} error={errors.source_url} type="url" hint="GitHub, GitLab, etc." />
            </Section>
          )}

          {/* Pricing */}
          <Section title="Pricing" subtitle="Optional. Shown in the Product details panel.">
            <Field label="Pricing summary" id="pricing" maxLength={120} value={fields.pricing} onChange={setText('pricing')} optional hint="e.g. Free during beta · Paid plans from D200/month" />
          </Section>

          {/* Gallery */}
          <Section title="Gallery" subtitle="Optional screenshots shown in the slideshow on your product page.">
            <RowList
              empty={!fields.gallery.length}
              addLabel="+ Add image"
              onAdd={() => addRow('gallery', { url: '', label: '' })}
            >
              {fields.gallery.map((g, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-start">
                  <Field label={`Image ${i + 1} URL`} id={`gallery_url_${i}`} value={g.url} onChange={(e) => updateRow('gallery', i, { url: e.target.value })} type="url" hideLabelOnSecond={i > 0} />
                  <Field label="Caption" id={`gallery_label_${i}`} value={g.label} onChange={(e) => updateRow('gallery', i, { label: e.target.value })} maxLength={40} hideLabelOnSecond={i > 0} />
                  <RemoveButton onClick={() => removeRow('gallery', i)} alignWithFirstRow={i === 0} />
                </div>
              ))}
            </RowList>
          </Section>

          {/* Built With */}
          <Section title="Built with" subtitle="Tools and services powering your product.">
            <RowList
              empty={!fields.built_with.length}
              addLabel="+ Add tool"
              onAdd={() => addRow('built_with', { name: '', description: '' })}
            >
              {fields.built_with.map((b, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2 items-start">
                  <Field label="Name" id={`bw_name_${i}`} value={b.name} onChange={(e) => updateRow('built_with', i, { name: e.target.value })} maxLength={40} hideLabelOnSecond={i > 0} />
                  <Field label="What it does" id={`bw_desc_${i}`} value={b.description} onChange={(e) => updateRow('built_with', i, { description: e.target.value })} maxLength={120} hideLabelOnSecond={i > 0} />
                  <RemoveButton onClick={() => removeRow('built_with', i)} alignWithFirstRow={i === 0} />
                </div>
              ))}
            </RowList>
          </Section>

          {/* Team */}
          <Section title="Launch team" subtitle="Other people involved. You'll automatically be included.">
            <RowList
              empty={!fields.team.length}
              addLabel="+ Add team member"
              onAdd={() => addRow('team', { name: '', role: '', bio: '' })}
            >
              {fields.team.map((t, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[180px_180px_1fr_auto] gap-2 items-start">
                  <Field label="Name" id={`tm_name_${i}`} value={t.name} onChange={(e) => updateRow('team', i, { name: e.target.value })} maxLength={60} hideLabelOnSecond={i > 0} />
                  <Field label="Role" id={`tm_role_${i}`} value={t.role} onChange={(e) => updateRow('team', i, { role: e.target.value })} maxLength={60} hideLabelOnSecond={i > 0} />
                  <Field label="Short bio" id={`tm_bio_${i}`} value={t.bio} onChange={(e) => updateRow('team', i, { bio: e.target.value })} maxLength={140} hideLabelOnSecond={i > 0} />
                  <RemoveButton onClick={() => removeRow('team', i)} alignWithFirstRow={i === 0} />
                </div>
              ))}
            </RowList>
          </Section>

          <div className="border-t border-border pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => { setFields(EMPTY_FIELDS); setErrors({}) }}
              className="text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors px-4 py-2.5"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-white font-semibold text-sm py-2.5 px-6 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Launching…' : 'Launch it'}
            </button>
          </div>
        </form>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80">
          <Toast message={toast} variant="error" onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-card p-6 md:p-7" style={{ boxShadow: cardShadow }}>
      <header className="mb-5">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-foreground-muted mt-0.5">{subtitle}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Fieldset({ legend, hint, error, children }: { legend: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground mb-1.5">{legend}</legend>
      {hint && <p className="text-xs text-foreground-muted mb-2">{hint}</p>}
      {children}
      <InlineError message={error ?? null} id={`${legend.toLowerCase()}-error`} />
    </fieldset>
  )
}

function RowList({ children, empty, onAdd, addLabel }: { children: React.ReactNode; empty: boolean; onAdd: () => void; addLabel: string }) {
  return (
    <div className="space-y-3">
      {!empty && <div className="space-y-3">{children}</div>}
      {empty && <p className="text-sm text-foreground-faint italic">None added yet.</p>}
      <button
        type="button"
        onClick={onAdd}
        className="text-sm font-semibold text-primary hover:underline cursor-pointer"
      >
        {addLabel}
      </button>
    </div>
  )
}

function RemoveButton({ onClick, alignWithFirstRow }: { onClick: () => void; alignWithFirstRow: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className={`text-foreground-faint hover:text-destructive transition-colors w-9 h-9 flex items-center justify-center rounded-button border border-border bg-surface hover:border-destructive ${alignWithFirstRow ? 'sm:mt-7' : ''}`}
      title="Remove"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    </button>
  )
}

type FieldProps = {
  label: string
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  error?: string
  hint?: string
  maxLength?: number
  type?: string
  textarea?: boolean
  optional?: boolean
  hideLabelOnSecond?: boolean
}

function Field({ label, id, value, onChange, error, hint, maxLength, type = 'text', textarea, optional, hideLabelOnSecond }: FieldProps) {
  const inputClass = `w-full border rounded-input px-3 py-2 text-sm focus:outline-none transition-colors ${
    error ? 'border-destructive' : 'border-border focus:border-primary'
  }`

  return (
    <div>
      <div className={`flex justify-between mb-1 ${hideLabelOnSecond ? 'sr-only' : ''}`}>
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}{optional && <span className="text-foreground-faint ml-1">(optional)</span>}
        </label>
        {maxLength && (
          <span className="text-xs text-foreground-faint">{value.length} / {maxLength}</span>
        )}
      </div>
      {hint && !hideLabelOnSecond && <p className="text-xs text-foreground-muted mb-1">{hint}</p>}
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          rows={5}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClass}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClass}
        />
      )}
      <InlineError message={error ?? null} id={`${id}-error`} />
    </div>
  )
}
