import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { InlineError } from '../components/InlineError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/submit')({ component: SubmitPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Fields = {
  name: string
  tagline: string
  description: string
  website_url: string
  logo_url: string
}

type Errors = Partial<Record<keyof Fields, string>>

function validate(fields: Fields): Errors {
  const errors: Errors = {}
  if (!fields.name.trim()) errors.name = 'Product name is required.'
  if (!fields.tagline.trim()) errors.tagline = 'Tagline is required.'
  if (!fields.description.trim()) errors.description = 'Description is required.'
  if (!fields.website_url.trim()) {
    errors.website_url = 'Website URL is required.'
  } else {
    try { new URL(fields.website_url) } catch { errors.website_url = 'Enter a valid URL.' }
  }
  if (fields.logo_url.trim()) {
    try { new URL(fields.logo_url) } catch { errors.logo_url = 'Enter a valid URL.' }
  }
  return errors
}

export function SubmitPage() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [fields, setFields] = useState<Fields>({ name: '', tagline: '', description: '', website_url: '', logo_url: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/me`, { credentials: 'include' }).then((r) => {
      if (r.status === 401) { window.location.href = '/login?next=/submit'; return }
      setAuthChecked(true)
    }).catch(() => setAuthChecked(true))
  }, [])

  function set(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...fields, logo_url: fields.logo_url || null }),
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
      <Header user={null} />
      <main className="max-w-2xl mx-auto px-6 lg:px-10 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Ship something</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field label="Product name" id="name" maxLength={80} value={fields.name} onChange={set('name')} error={errors.name} />
          <Field label="Tagline" id="tagline" maxLength={120} value={fields.tagline} onChange={set('tagline')} error={errors.tagline} hint="One line. What does it do?" />
          <Field label="Description" id="description" maxLength={2000} value={fields.description} onChange={set('description')} error={errors.description} textarea />
          <Field label="Website URL" id="website_url" value={fields.website_url} onChange={set('website_url')} error={errors.website_url} type="url" />
          <Field label="Logo URL" id="logo_url" value={fields.logo_url} onChange={set('logo_url')} error={errors.logo_url} type="url" optional />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-semibold py-2.5 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Launching…' : 'Launch it'}
          </button>
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
}

function Field({ label, id, value, onChange, error, hint, maxLength, type = 'text', textarea, optional }: FieldProps) {
  const inputClass = `w-full border rounded-input px-3 py-2 text-sm focus:outline-none transition-colors ${
    error ? 'border-destructive' : 'border-border focus:border-primary'
  }`

  return (
    <div>
      <div className="flex justify-between mb-1">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}{optional && <span className="text-foreground-faint ml-1">(optional)</span>}
        </label>
        {maxLength && (
          <span className="text-xs text-foreground-faint">{value.length} / {maxLength}</span>
        )}
      </div>
      {hint && <p className="text-xs text-foreground-muted mb-1">{hint}</p>}
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
