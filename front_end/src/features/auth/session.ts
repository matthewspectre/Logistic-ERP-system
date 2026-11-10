import type { AuthSession } from './types'

const SESSION_KEY = 'evindo.auth.session'

export function readSession(): AuthSession | null {
  const storedSession = sessionStorage.getItem(SESSION_KEY)
  if (!storedSession) return null

  try {
    const session = JSON.parse(storedSession) as AuthSession
    if (session.token && session.user) return session
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
  }

  return null
}

export function saveSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}