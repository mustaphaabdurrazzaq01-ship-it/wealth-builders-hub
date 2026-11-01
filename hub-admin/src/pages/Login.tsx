import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { session, profile, loading, notice, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from ?? '/'

  if (!loading && session && profile) return <Navigate to={from} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) return setError('Enter your email and password.')
    setBusy(true)
    const err = await signIn(email.trim(), password)
    setBusy(false)
    if (err) return setError(err)
    nav(from, { replace: true })
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit} noValidate>
        <span className="mark" aria-hidden="true">WB</span>
        <h1>Admin Studio</h1>
        <p className="muted" style={{ marginTop: 0 }}>Wealth Builders Hub. Authorised staff only.</p>
        {(notice || error) && <div className="alert alert--err" role="alert">{error ?? notice}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn--primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
