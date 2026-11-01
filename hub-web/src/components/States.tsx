import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid--3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton" style={{ aspectRatio: '16 / 10' }} />
          <div style={{ padding: 20, display: 'grid', gap: 10 }}>
            <div className="skeleton" style={{ height: 18, width: '80%' }} />
            <div className="skeleton" style={{ height: 14, width: '95%' }} />
            <div className="skeleton" style={{ height: 14, width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Empty({ title, children, to, cta }: { title: string; children: ReactNode; to?: string; cta?: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
      {to && cta && (
        <p style={{ marginTop: 14 }}>
          <Link className="link-arrow" to={to}>
            {cta}
          </Link>
        </p>
      )}
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="notice notice--err" role="alert">
      Couldn't load this content. {message}{' '}
      {onRetry && (
        <button className="link-arrow" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, color: 'inherit', textDecoration: 'underline' }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="wrap section">
          <h1>Something broke on our side</h1>
          <p className="lede">Reload the page. If it keeps happening, tell us through the contact page.</p>
          <a className="btn btn--primary" href="/">
            Back to home
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
