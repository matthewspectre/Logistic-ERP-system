import type { ApiErrorResponse } from '../types/api'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const normalizedPath = path.replace(/^\/+/, '')
  const response = await fetch(`${API_BASE_URL}/${normalizedPath}`, { ...init, headers })

  if (!response.ok) {
    const result = (await response.json().catch(() => undefined)) as ApiErrorResponse | undefined
    const error = result?.error
    const message = typeof error === 'string' ? error : error?.message
    throw new Error(message || `${response.status} ${response.statusText}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
