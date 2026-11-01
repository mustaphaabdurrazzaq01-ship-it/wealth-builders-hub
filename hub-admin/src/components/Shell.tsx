import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type Role } from '../lib/auth'

interface Item { to: string; label: string; roles: Role[] }
const NAV: Item[] = [
  { to: '/', label: 'Overview', roles: ['admin', 'editor'] },
  { to: '/articles', label: 'Articles', roles: ['admin', 'editor'] },
  { to: '/resources', label: 'Resources', roles: ['admin', 'editor'] },
  { to: '/products', label: 'Products', roles: ['admin'] },
  { to: '/applications', label: 'Affiliate applications', roles: ['admin'] },
  { to: '/messages', label: 'Messages and subscribers', roles: ['admin'] },
  { to: '/users', label: 'Users and profiles', roles: ['admin'] },
  { to: '/seo', label: 'SEO and discovery', roles: ['admin'] },
  { to: '/settings', label: 'Site settings', roles: ['admin'] },
  { to: '/activity', label: 'Activity logs', roles: ['admin'] },
  { to: '/status', label: 'System status', roles: ['admin', 'editor'] },
]

export function RequireAuth() {
  const { session, profile, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="boot">Loading Admin Studio…</div>
  if (!session || !profile) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <Shell />
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { profile } = useAuth()
  if (!profile || !roles.includes(profile.role)) {
    return (
      <div className="alert alert--err" role="alert" style={{ margin: 24 }}>
        Your role ({profile?.role ?? 'unknown'}) does not allow access to this section.
      </div>
    )
  }
  return <>{children}</>
}

function Shell() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  const items = NAV.filter((n) => profile && n.roles.includes(profile.role))

  const links = (
    <nav aria-label="Admin">
      {items.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
          {n.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="shell">
      <aside className="side" data-open={open}>
        <div className="side__brand"><span className="mark">WB</span><div><strong>Admin Studio</strong><small>Wealth Builders Hub</small></div></div>
        {links}
        <div className="side__user">
          <div><strong>{profile?.display_name || 'Signed in'}</strong><small>{profile?.role}</small></div>
          <button className="btn btn--sm" onClick={() => void signOut()}>Sign out</button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="btn btn--icon" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className="burger" />
          </button>
          <strong>Admin Studio</strong>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
