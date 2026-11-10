import { apiRequest } from '../../../services/api'
import type { AuthUser } from '../types'

export function createUser(name: string, email: string, password: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role: 'USER' }),
  })
}