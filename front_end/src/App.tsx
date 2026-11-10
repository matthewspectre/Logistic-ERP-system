import { useState } from 'react'
import LoginPage from './features/auth/login/LoginPage'
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

  return (
    <main className="session-page">
      <a className="wordmark" href="/" aria-label="Evindo">
        <span className="wordmark-symbol" aria-hidden="true">E</span>
        <span>EVINDO</span>
      </a>
      <section className="session-content" aria-labelledby="session-title">
        <p className="eyebrow">AKSES TERVERIFIKASI</p>
        <h1 id="session-title">Selamat datang, {session.user.name}</h1>
        <p className="session-copy">Anda berhasil masuk ke sistem Evindo.</p>
        <dl className="session-details">
          <div>
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{session.user.role}</dd>
          </div>
        </dl>
        <button className="logout-button" type="button" onClick={handleLogout}>
          Keluar dari akun
        </button>
      </section>
      <p className="session-footer">INVENTORY · PROCUREMENT · OPERATIONS</p>
    </main>
  )
}

export default App
