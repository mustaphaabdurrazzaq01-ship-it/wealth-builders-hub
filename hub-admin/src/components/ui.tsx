import { useEffect, useRef, type ReactNode } from 'react'

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  )
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" style={{ display: 'grid', gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
    </div>
  )
}

export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="alert alert--err" role="alert">
      {message} {retry && <button className="linklike" onClick={retry}>Retry</button>}
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = { published: 'ok', active: 'ok', approved: 'ok', draft: 'neutral', pending: 'warn', under_review: 'info', archived: 'neutral', rejected: 'err', new: 'warn', read: 'neutral' }
  const label: Record<string, string> = { pending: 'New', under_review: 'Under review', active: 'Published' }
  return <span className={`pill pill--${map[status] ?? 'neutral'}`}>{label[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}</span>
}

export function Confirm({ title, children, confirmLabel = 'Delete', busy, onConfirm, onCancel }: { title: string; children: ReactNode; confirmLabel?: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="cf-title">{title}</h2>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">
          <button className="btn" ref={ref} onClick={onCancel}>Cancel</button>
          <button className="btn btn--danger" disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export function FileField({ label, accept, hint, onPick, current }: { label: string; accept: string; hint?: string; onPick: (f: File | null) => void; current?: string | null }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="file" accept={accept} className="input" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
      {current && <span className="hint">Current: {current}</span>}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
