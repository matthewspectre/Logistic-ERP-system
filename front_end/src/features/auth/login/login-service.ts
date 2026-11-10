import { apiRequest } from '../../../services/api'
import type { AuthSession } from '../types'

export function login(email: string, password: string): Promise<AuthSession> {
  return apiRequest<AuthSession>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}