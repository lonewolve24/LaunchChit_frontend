import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { getMe, clearMe, type Me } from './auth'

const fakeMe: Me = { id: 'u1', email: 'a@b.c', name: 'Test', avatar_url: null, role: 'user' }

beforeEach(() => {
  clearMe()
})

describe('getMe', () => {
  it('returns the user on 200', async () => {
    server.use(http.get('http://localhost:8000/me', () => HttpResponse.json(fakeMe)))
    const me = await getMe()
    expect(me).toEqual(fakeMe)
  })

  it('returns null on 401', async () => {
    server.use(http.get('http://localhost:8000/me', () => new HttpResponse(null, { status: 401 })))
    const me = await getMe()
    expect(me).toBeNull()
  })

  it('returns null when fetch errors', async () => {
    server.use(http.get('http://localhost:8000/me', () => HttpResponse.error()))
    const me = await getMe()
    expect(me).toBeNull()
  })

  it('shares the in-flight promise across concurrent callers (one fetch)', async () => {
    let calls = 0
    server.use(http.get('http://localhost:8000/me', () => {
      calls++
      return HttpResponse.json(fakeMe)
    }))
    const [a, b, c] = await Promise.all([getMe(), getMe(), getMe()])
    expect(a).toEqual(fakeMe)
    expect(b).toEqual(fakeMe)
    expect(c).toEqual(fakeMe)
    expect(calls).toBe(1)
  })

  it('caches the resolved value until clearMe()', async () => {
    let calls = 0
    server.use(http.get('http://localhost:8000/me', () => {
      calls++
      return HttpResponse.json(fakeMe)
    }))
    await getMe()
    await getMe()
    expect(calls).toBe(1)
    clearMe()
    await getMe()
    expect(calls).toBe(2)
  })
})
