import { useState } from 'react'
import type { FormEvent } from 'react'
import { login } from './login-service'
import type { AuthSession } from '../types'

interface LoginPageProps {
  onAuthenticated: (session: AuthSession) => void
}

function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const session = await login(email.trim(), password)
      onAuthenticated(session)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login gagal. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="brand-panel" aria-label="Evindo inventory platform">
        <a className="wordmark" href="/" aria-label="Evindo">
          <span className="wordmark-symbol" aria-hidden="true">E</span>
          <span>EVINDO</span>
        </a>

        <div className="brand-copy">
          <p className="eyebrow">INVENTORY &amp; PROCUREMENT</p>
          <h1>Semua pergerakan barang, tercatat dengan jelas.</h1>
          <p className="brand-description">
            Satu ruang kerja untuk mengelola pengadaan, penerimaan, dan stok gudang.
          </p>
        </div>

        <div className="inventory-visual" aria-hidden="true">
          <div className="visual-heading">
            <span>CONTOH DASHBOARD</span>
            <span className="visual-live"><i /> PREVIEW</span>
          </div>
          <div className="visual-total">
            <span>Contoh item aktif</span>
            <strong>1,284</strong>
            <span className="visual-change">+12 minggu ini</span>
          </div>
          <div className="visual-bars">
            <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
          </div>
          <div className="visual-legend">
            <span><i className="legend-stock" /> Stok tersedia</span>
            <span>4 gudang</span>
          </div>
        </div>

        <p className="panel-footer">INVENTORY · PROCUREMENT · OPERATIONS</p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-content">
          <div className="mobile-wordmark wordmark" aria-label="Evindo">
            <span className="wordmark-symbol" aria-hidden="true">E</span>
            <span>EVINDO</span>
          </div>
          <p className="eyebrow login-eyebrow">SELAMAT DATANG KEMBALI</p>
          <h2 id="login-title">Masuk ke akun Anda</h2>
          <p className="login-intro">Gunakan akun Evindo untuk melanjutkan.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              autoComplete="username"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@perusahaan.com"
              required
              type="email"
              value={email}
            />

            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <button
                aria-label={passwordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
                className="password-toggle"
                onClick={() => setPasswordVisible((visible) => !visible)}
                type="button"
              >
                {passwordVisible ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <input
              autoComplete="current-password"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              required
              type={passwordVisible ? 'text' : 'password'}
              value={password}
            />

            {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

            <button className="submit-button" disabled={isSubmitting} type="submit">
              <span>{isSubmitting ? 'Memeriksa akun...' : 'Masuk'}</span>
              <span aria-hidden="true">&#8594;</span>
            </button>
          </form>

          <p className="login-note">Akses hanya untuk pengguna yang terdaftar.</p>
        </div>
        <p className="login-footer">EVINDO · INTERNAL SYSTEM</p>
      </section>
    </main>
  )
}

export default LoginPage