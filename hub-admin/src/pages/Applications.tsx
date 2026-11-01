import { useEffect, useMemo, useState } from 'react'
import { Confirm, Empty, ErrorBox, Loading, PageHead, StatusPill } from '../components/ui'
import { logAction, useAuth } from '../lib/auth'
import { fmtDate, useAsync } from '../lib/hooks'
import { errMessage, supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'

type Status = 'pending' | 'under_review' | 'approved' | 'rejected'
interface App {
  id: string; full_name: string; email: string; country: string | null; whatsapp: string | null; platforms: string[]
  social_link: string | null; audience_size: string | null; message: string | null; audience_description: string | null
  status: Status; admin_notes: string | null; created_at: string; reviewed_at: string | null; agreed_to_terms: boolean
}
interface Ev { id: string; from_status: string | null; to_status: string; note: string | null; created_at: string }

const LABEL: Record<Status, string> = { pending: 'New', under_review: 'Under review', approved: 'Approved', rejected: 'Rejected' }
const COLS = 'id,full_name,email,country,whatsapp,platforms,social_link,audience_size,message,audience_description,status,admin_notes,created_at,reviewed_at,agreed_to_terms'

export default function Applications() {
  const { data, loading, error, reload } = useAsync(async () => {
    const { data, error } = await supabase.from('affiliate_applications').select(COLS).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as App[]
  }, [])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const shown = useMemo(
    () => (data ?? []).filter((r) => (!status || r.status === status) && (!q || `${r.full_name} ${r.email} ${r.country ?? ''}`.toLowerCase().includes(q.toLowerCase()))),
    [data, q, status],
  )
  const open = data?.find((r) => r.id === openId) ?? null

  return (
    <>
      <PageHead title="Affiliate applications" sub="Review each application by hand. Approval is an admin action and is recorded in the history." />
      <div className="filters">
        <input className="input" type="search" placeholder="Search name, email or country" aria-label="Search applications" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {(Object.keys(LABEL) as Status[]).map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && data.length === 0 && <Empty title="No applications yet">Applications from the public affiliate form will appear here.</Empty>}
      {data && data.length > 0 && shown.length === 0 && <Empty title="No applications match your filters" />}
      {shown.length > 0 && (
        <div className="rows">
          {shown.map((r) => (
            <button key={r.id} className="row" onClick={() => setOpenId(r.id)}>
              <strong>{r.full_name}</strong>
              <div className="row__meta">
                <StatusPill status={r.status} />
                <span>{r.email}</span>
                {r.country && <span>{r.country}</span>}
                <span>{fmtDate(r.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && <Detail app={open} onClose={() => setOpenId(null)} onChanged={reload} />}
    </>
  )
}

function Detail({ app, onClose, onChanged }: { app: App; onClose: () => void; onChanged: () => void }) {
  const { session } = useAuth()
  const toast = useToast()
  const [notes, setNotes] = useState(app.admin_notes ?? '')
  const [busy, setBusy] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const events = useAsync(async () => {
    const { data, error } = await supabase.from('application_events').select('id,from_status,to_status,note,created_at').eq('application_id', app.id).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Ev[]
  }, [app.id])

  useEffect(() => setNotes(app.admin_notes ?? ''), [app.id, app.admin_notes])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !confirmReject && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, confirmReject])

  async function move(next: Status) {
    if (!session) return
    setBusy(true)
    try {
      const reviewed = next === 'pending' ? null : new Date().toISOString()
      const { error } = await supabase.from('affiliate_applications').update({ status: next, admin_notes: notes.trim() || null, reviewed_at: reviewed, reviewed_by: next === 'pending' ? null : session.user.id }).eq('id', app.id)
      if (error) throw error
      const ev = await supabase.from('application_events').insert({ application_id: app.id, from_status: app.status, to_status: next, note: notes.trim() || null, actor: session.user.id })
      if (ev.error) toast('err', `Status saved, but the history entry failed: ${ev.error.message}`)
      void logAction(next === 'approved' ? 'affiliate.approve' : next === 'rejected' ? 'affiliate.reject' : 'affiliate.status', 'affiliate_application', app.id, { to: next })
      toast('ok', `Marked as ${LABEL[next].toLowerCase()}.`)
      onChanged()
      events.reload()
    } catch (e) {
      toast('err', `Not saved: ${errMessage(e)}`)
    } finally {
      setBusy(false)
      setConfirmReject(false)
    }
  }

  async function saveNotes() {
    setBusy(true)
    const { error } = await supabase.from('affiliate_applications').update({ admin_notes: notes.trim() || null }).eq('id', app.id)
    setBusy(false)
    if (error) return toast('err', `Not saved: ${error.message}`)
    void logAction('affiliate.notes', 'affiliate_application', app.id)
    toast('ok', 'Notes saved.')
    onChanged()
  }

  const dl: [string, string | null][] = [
    ['Email', app.email], ['Country', app.country], ['WhatsApp', app.whatsapp], ['Platforms', app.platforms?.join(', ') || null],
    ['Audience size', app.audience_size], ['Social link', app.social_link], ['Agreed to rules', app.agreed_to_terms ? 'Yes' : 'No'],
    ['Applied', fmtDate(app.created_at)], ['Last reviewed', fmtDate(app.reviewed_at)],
  ]

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ap-title" style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 id="ap-title" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{app.full_name} <StatusPill status={app.status} /></h2>
        <div className="modal__body">
          <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(0,140px) minmax(0,1fr)', gap: '6px 12px', margin: '0 0 16px' }}>
            {dl.map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt className="muted">{k}</dt>
                <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>
                  {k === 'Social link' && v && /^https?:\/\//i.test(v) ? <a href={v} target="_blank" rel="noopener noreferrer">{v}</a> : (v || '—')}
                </dd>
              </div>
            ))}
          </dl>
          <div className="field"><label>Promotion plan</label><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{app.message || app.audience_description || '—'}</p></div>
          <div className="field">
            <label htmlFor="notes">Internal notes</label>
            <textarea id="notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <span className="hint">Only admins can see these notes.</span>
          </div>
          <div className="tabs" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn--sm" disabled={busy || notes === (app.admin_notes ?? '')} onClick={() => void saveNotes()}>Save notes</button>
            {app.status !== 'pending' && <button className="btn btn--sm" disabled={busy} onClick={() => void move('pending')}>Mark as new</button>}
            {app.status !== 'under_review' && <button className="btn btn--sm" disabled={busy} onClick={() => void move('under_review')}>Start review</button>}
            {app.status !== 'approved' && <button className="btn btn--sm btn--primary" disabled={busy} onClick={() => void move('approved')}>Approve</button>}
            {app.status !== 'rejected' && <button className="btn btn--sm btn--danger" disabled={busy} onClick={() => setConfirmReject(true)}>Reject</button>}
          </div>
          {app.status === 'approved' && <p className="hint">Approving records the decision only. No email is sent yet, so contact the applicant yourself with their Selar affiliate link.</p>}
          <h3 style={{ margin: '16px 0 8px' }}>History</h3>
          {events.loading && <Loading rows={1} />}
          {events.error && <ErrorBox message={events.error} retry={events.reload} />}
          {events.data && events.data.length === 0 && <p className="muted" style={{ margin: 0 }}>No status changes recorded yet.</p>}
          {events.data && events.data.map((e) => (
            <div key={e.id} className="row__meta" style={{ marginBottom: 6 }}>
              <span>{fmtDate(e.created_at)}</span>
              <strong>{e.from_status ? `${LABEL[e.from_status as Status] ?? e.from_status} → ` : ''}{LABEL[e.to_status as Status] ?? e.to_status}</strong>
              {e.note && <span>{e.note}</span>}
            </div>
          ))}
        </div>
        <div className="modal__actions"><button className="btn" onClick={onClose}>Close</button></div>
      </div>
      {confirmReject && (
        <Confirm title="Reject this application?" confirmLabel="Reject" busy={busy} onConfirm={() => void move('rejected')} onCancel={() => setConfirmReject(false)}>
          {app.full_name} will be marked as rejected. You can move it back to new or under review later.
        </Confirm>
      )}
    </div>
  )
}
