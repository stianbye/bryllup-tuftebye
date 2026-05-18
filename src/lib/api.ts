// API-klient mot Pages Functions
import type { WeddingState } from '@/types/database'

const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${path}: ${res.status} ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getMe: () => request<{ email: string }>('/me'),
  getState: () => request<WeddingState>('/state'),
  mutate: (body: { op: string; [k: string]: unknown }) =>
    request<{ ok: true; result: unknown }>('/mutate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
