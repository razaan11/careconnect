import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getStoredUser, logout } from '../api/hooks/useAuth'

const NAV_BY_ROLE = {
  DONOR: [
    { to: '/donor', label: 'Dashboard', end: true },
    { to: '/donor/needs', label: 'Who needs help' },
    { to: '/donor/new', label: 'New donation' },
  ],
  TRUST: [
    { to: '/trust', label: 'Dashboard', end: true },
    { to: '/trust/needs/new', label: 'Post a need' },
    { to: '/trust/otp', label: 'Generate OTP' },
  ],
  VOLUNTEER: [{ to: '/volunteer-info', label: 'Volunteer' }],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/trusts', label: 'Verify trusts' },
  ],
}

export default function Layout() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const links = user ? NAV_BY_ROLE[user.role] || [] : []

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-hairline bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="focus-ring flex items-center gap-2 rounded">
              <span className="font-display text-xl font-semibold tracking-tight text-primary">
                CareConnect
              </span>
            </NavLink>
            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `focus-ring rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text/60 hover:bg-primary/5 hover:text-text'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-text">{user.name}</p>
                <p className="font-mono text-[11px] uppercase tracking-wide text-text/40">
                  {user.role}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="focus-ring rounded-md border border-hairline bg-paper px-3 py-1.5 text-sm font-medium text-text/70 transition-colors hover:border-error/40 hover:text-error"
            >
              Log out
            </button>
          </div>
        </div>
        {links.length > 0 && (
          <nav className="flex items-center gap-1 overflow-x-auto px-6 pb-3 sm:hidden">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `focus-ring shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-text/60'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
