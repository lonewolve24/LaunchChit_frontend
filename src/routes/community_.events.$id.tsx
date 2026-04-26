import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { Skeleton } from '../components/Skeleton'
import { PageError } from '../components/PageError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/community_/events/$id')({ component: EventDetailPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

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

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

function formatDateRange(startISO: string, endISO: string) {
  const s = new Date(startISO), e = new Date(endISO)
  const dateStr = s.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const startTime = s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const endTime = e.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return { dateStr, startTime, endTime }
}

function toGCalDate(iso: string) {
  // YYYYMMDDTHHmmssZ (UTC)
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
}

function googleCalUrl(e: Event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${toGCalDate(e.start)}/${toGCalDate(e.end)}`,
    details: e.description,
    location: e.location + (e.address ? ` — ${e.address}` : ''),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function outlookCalUrl(e: Event) {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
    body: e.description,
    location: e.location + (e.address ? ` — ${e.address}` : ''),
    startdt: e.start,
    enddt: e.end,
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

function buildIcs(e: Event) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LaunchedChit//Community Events//EN',
    'BEGIN:VEVENT',
    `UID:${e.id}@launchedchit.gm`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(e.start)}`,
    `DTEND:${fmt(e.end)}`,
    `SUMMARY:${escape(e.title)}`,
    `DESCRIPTION:${escape(e.description)}`,
    `LOCATION:${escape(e.location + (e.address ? ` — ${e.address}` : ''))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function downloadIcs(e: Event) {
  const blob = new Blob([buildIcs(e)], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${e.slug}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function EventDetailPage() {
  const { id } = useParams({ from: '/community_/events/$id' })
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [rsvped, setRsvped] = useState(false)
  const [calMenuOpen, setCalMenuOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/community/events/${id}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => { if (data) { setEvent(data); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [id])

  if (notFound) return <><Header /><PageError status={404} message="That event does not exist." /></>

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-surface-subtle">
        <Header />
        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-4">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-72 w-full rounded-card" />
        </main>
      </div>
    )
  }

  const { dateStr, startTime, endTime } = formatDateRange(event.start, event.end)
  const pct = (event.attendees / event.capacity) * 100
  const spotsLeft = event.capacity - event.attendees

  function handleRsvp() {
    setRsvped((v) => !v)
    setToast({ message: rsvped ? 'RSVP cancelled.' : 'RSVPed. Add it to your calendar below.', variant: 'success' })
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <a href="/community" className="text-foreground-faint hover:text-foreground transition-colors">Community</a>
          <span className="text-foreground-faint">›</span>
          <a href="/community?tab=events" className="text-foreground-faint hover:text-foreground transition-colors">Events</a>
          <span className="text-foreground-faint">›</span>
          <span className="text-foreground-muted truncate max-w-xs">{event.title}</span>
        </div>

        <div className="bg-surface rounded-card overflow-hidden" style={{ boxShadow: cardShadow }}>
          {/* Cover */}
          <div
            className="h-40 md:h-56 flex items-end p-6 md:p-8 text-white"
            style={{ background: `linear-gradient(135deg, ${event.cover_color} 0%, ${event.color} 100%)` }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  event.mode === 'In person' ? 'text-white bg-white/20' : 'text-white bg-white/20'
                }`}>
                  {event.mode}
                </span>
                {event.topics?.map((t) => (
                  <span key={t} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15">
                    {t}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight max-w-3xl">{event.title}</h1>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-card flex flex-col items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                >
                  <span className="text-[10px] font-bold uppercase opacity-80">{new Date(event.start).toLocaleDateString('en-GB', { month: 'short' })}</span>
                  <span className="text-xl font-bold leading-none">{new Date(event.start).getDate()}</span>
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">{dateStr}</p>
                  <p className="text-sm text-foreground-muted mt-0.5">{startTime} — {endTime}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-1.5">Location</p>
                <p className="text-sm text-foreground">📍 {event.location}</p>
                {event.address && <p className="text-xs text-foreground-muted mt-0.5">{event.address}</p>}
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-1.5">About this event</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>

              {event.agenda && event.agenda.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">Agenda</p>
                  <div className="space-y-2">
                    {event.agenda.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <span className="font-mono text-xs text-foreground-faint w-12 flex-shrink-0 pt-0.5">{a.time}</span>
                        <span className="text-foreground">{a.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-2">Hosted by</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: '#1E293B' }}
                  >
                    {event.host[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{event.host}</p>
                    {event.host_bio && <p className="text-xs text-foreground-muted">{event.host_bio}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar — RSVP + add to calendar */}
            <aside className="space-y-4">
              <div className="bg-surface-subtle rounded-card p-5">
                <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">Attendance</p>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-foreground font-bold">{event.attendees}<span className="text-foreground-faint font-normal"> / {event.capacity}</span></span>
                  <span className="text-xs text-foreground-muted">{spotsLeft} spots left</span>
                </div>
                <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <button
                  onClick={handleRsvp}
                  className={`w-full text-sm font-semibold py-2.5 rounded-button transition-colors ${
                    rsvped
                      ? 'bg-primary text-white'
                      : 'bg-accent text-white hover:bg-accent-dark'
                  }`}
                >
                  {rsvped ? '✓ You\'re going' : 'RSVP'}
                </button>
              </div>

              <div className="bg-surface-subtle rounded-card p-5 relative">
                <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">Add to calendar</p>
                <button
                  onClick={() => setCalMenuOpen((o) => !o)}
                  className="w-full text-sm font-semibold border border-border bg-surface text-foreground py-2.5 rounded-button hover:border-border-strong transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  Save to calendar ▾
                </button>
                {calMenuOpen && (
                  <div className="absolute left-5 right-5 mt-2 bg-surface rounded-card py-1 z-10" style={{ boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.18)' }}>
                    <a
                      href={googleCalUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setCalMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-surface-subtle transition-colors"
                    >
                      Google Calendar
                    </a>
                    <a
                      href={outlookCalUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setCalMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-surface-subtle transition-colors"
                    >
                      Outlook / Microsoft 365
                    </a>
                    <button
                      onClick={() => { downloadIcs(event); setCalMenuOpen(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-subtle transition-colors"
                    >
                      Apple Calendar (.ics)
                    </button>
                    <button
                      onClick={() => { downloadIcs(event); setCalMenuOpen(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-subtle transition-colors"
                    >
                      Download .ics file
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-surface-subtle rounded-card p-5">
                <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">Share</p>
                <div className="flex gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs font-semibold border border-border bg-surface text-foreground py-2 rounded-button hover:border-border-strong transition-colors"
                  >
                    X
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(event.title + ': ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs font-semibold border border-border bg-surface text-foreground py-2 rounded-button hover:border-border-strong transition-colors"
                  >
                    WhatsApp
                  </a>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); setToast({ message: 'Link copied!', variant: 'success' }) }}
                    className="flex-1 text-xs font-semibold border border-border bg-surface text-foreground py-2 rounded-button hover:border-border-strong transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
