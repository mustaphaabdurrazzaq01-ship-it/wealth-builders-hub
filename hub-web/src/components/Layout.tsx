import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/articles', label: 'Articles' },
  { to: '/resources', label: 'Resources' },
  { to: '/products', label: 'Products' },
  { to: '/affiliate', label: 'Affiliates' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Wealth Builders Hub, home">
      <span className="brand__mark" aria-hidden="true">
        WB
      </span>
      <span>Wealth Builders Hub</span>
    </Link>
  )
}

export function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : undefined)

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="wrap site-header__row">
          <Brand />
          <nav className="nav" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={cls}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button className="nav-toggle" aria-label="Menu" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
            <span />
          </button>
        </div>
        <div className="mobile-nav" id="mobile-nav" data-open={open}>
          <div>
            <nav aria-label="Mobile">
              {LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} className={cls} tabIndex={open ? 0 : -1}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <Brand />
              <p>Practical education on digital business, AI tools and online income. Learn. Build. Grow.</p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><Link to="/articles">Articles</Link></li>
                <li><Link to="/resources">Resources</Link></li>
                <li><Link to="/products">Digital products</Link></li>
              </ul>
            </div>
            <div>
              <h4>Programme</h4>
              <ul>
                <li><Link to="/affiliate">Affiliate programme</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><Link to="/legal/privacy">Privacy policy</Link></li>
                <li><Link to="/legal/terms">Terms of use</Link></li>
                <li><Link to="/legal/affiliate-disclosure">Affiliate disclosure</Link></li>
                <li><Link to="/legal/disclaimer">Educational disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-base">
            <span>© {new Date().getFullYear()} Wealth Builders Hub. All rights reserved.</span>
            <span>Education only. Results vary and nothing here is a guarantee of income.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
