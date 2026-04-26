import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type Me = { id: string; name: string | null; email: string; avatar_url: string | null }

export function useMe() {
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setUser(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { user, loading }
}
