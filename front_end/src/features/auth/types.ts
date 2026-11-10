export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}