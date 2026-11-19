import { useState } from 'react'
import LoginPage from './features/auth/login/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import { clearSession, readSession, saveSession } from './features/auth/session'
import type { AuthSession } from './features/auth/types'
import './App.css'

function App() {
  const [session, setSession] = useState<AuthSession | null>(readSession)

  function handleAuthenticated(authSession: AuthSession) {
    saveSession(authSession)
    setSession(authSession)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
  }

  if (!session) {
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  return <DashboardPage session={session} onLogout={handleLogout} />
}

export default App
