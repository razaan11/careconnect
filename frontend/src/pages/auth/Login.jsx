import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../../api/hooks/useAuth'
import BrandPanel from '../../components/BrandPanel'

const ROLE_HOME = {
  DONOR: '/donor',
  TRUST: '/trust',
  VOLUNTEER: '/volunteer-info',
  ADMIN: '/admin',
}

export default function Login() {
  const navigate = useNavigate()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          navigate(ROLE_HOME[data.user?.role] || '/login', { replace: true })
        },
      }
    )
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <BrandPanel
        eyebrow="Sign in"
        heading="Every donation, tracked to the handoff."
        body="Log a food, clothing, or book donation and follow it as a verified trust receives it — checkpoint by checkpoint."
      />

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-text/60">Sign in to your CareConnect account.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring mt-1.5 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-text placeholder:text-text/30"
                placeholder="you@example.org"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring mt-1.5 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-text placeholder:text-text/30"
                placeholder="••••••••"
              />
            </div>

            {login.isError && (
              <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                {login.error?.response?.data?.error ||
                  "That email and password combination doesn't match our records."}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="focus-ring w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text/60">
            New to CareConnect?{' '}
            <Link to="/register" className="focus-ring rounded font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
