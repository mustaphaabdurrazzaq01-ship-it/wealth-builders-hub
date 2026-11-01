import { useState } from 'react'
import { Confirm, Empty, ErrorBox, Loading, PageHead, StatusPill, copyText } from '../components/ui'
import { logAction } from '../lib/auth'
import { fmtDate, useAsync } from '../lib/hooks'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'

interface Msg { id: string; name: string; email: string; reason: string | null; message: string; status: 'new' | 'read' | 'archived'; created_at: string }
interface Sub { id: string; email: string; source: string; created_at: string }

export default function Messages() {
  const [tab, setTab] = useState<'messages' | 'subscribers'>('messages')
  return (
    <>
      <PageHead title="Messages and subscribers" sub="Contact form enquiries and newsletter sign-ups saved in the database." />
      <div className="tabs">
        <button className="tab" aria-pressed={tab === 'messages'} onClick={() => setTab('messages')}>Messages</button>
        <button className="tab" aria-pressed={tab === 'subscribers'} onClick={() => setTab('subscribers')}>Newsletter subscribers</button>
      </div>
      {tab === 'messages' ? <MessageList /> : <SubscriberList />}
    </>
  )
}

function MessageList() {
  const toast = useToast()
  const [filter, setFilter] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const { data, loading, error, reload } = useAsync(async () => {
    const { data, error } = await supabase.from('contact_messages').select('id,name,email,reason,message,status,created_at').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Msg[]
  }, [])
  const shown = (data ?? []).filter((m) => !filter || m.status === filter)

  async function setStatus(m: Msg, status: Msg['status']) {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', m.id)
    if (error) return toast('err', `Not saved: ${error.message}`)
    void logAction('message.status', 'contact_message', m.id, { status })
    reload()
  }

  return (
    <>
      <div className="filters">
        <select className="select" aria-label="Filter messages" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All messages</option><option value="new">New</option><option value="read">Read</option><option value="archived">Archived</option>
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && data.length === 0 && <Empty title="No messages yet">Messages sent through the public contact form will appear here.</Empty>}
      {data && data.length > 0 && shown.length === 0 && <Empty title="No messages match this filter" />}
      {shown.length > 0 && (
        <div className="rows">
          {shown.map((m) => (
            <div key={m.id} className="row">
              <button className="linklike" style={{ textAlign: 'left' }} onClick={() => { setOpenId(openId === m.id ? null : m.id); if (m.status === 'new') void setStatus(m, 'read') }} aria-expanded={openId === m.id}>
                <strong>{m.name}</strong> <span className="muted">· {m.email}</span>
              </button>
              <div className="row__meta"><StatusPill status={m.status} />{m.reason && <span>{m.reason}</span>}<span>{fmtDate(m.created_at)}</span></div>
              {openId === m.id && (
                <div style={{ marginTop: 6 }}>
                  <p style={{ margin: '0 0 10px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.message}</p>
                  <div className="tabs" style={{ marginBottom: 0 }}>
                    <a className="btn btn--sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Wealth Builders Hub')}`}>Reply by email</a>
                    {m.status !== 'archived' && <button className="btn btn--sm" onClick={() => void setStatus(m, 'archived')}>Archive</button>}
                    {m.status === 'archived' && <button className="btn btn--sm" onClick={() => void setStatus(m, 'new')}>Mark as new</button>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function SubscriberList() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [del, setDel] = useState<Sub | null>(null)
  const [busy, setBusy] = useState(false)
  const { data, loading, error, reload } = useAsync(async () => {
    const { data, error } = await supabase.from('newsletter_subscribers').select('id,email,source,created_at').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Sub[]
  }, [])
  const shown = (data ?? []).filter((s) => !q || s.email.toLowerCase().includes(q.toLowerCase()))

  function exportCsv() {
    const rows = ['email,source,subscribed_at', ...shown.map((s) => `${s.email},${s.source},${s.created_at}`)]
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsletter-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
    void logAction('subscribers.export', 'newsletter', undefined, { count: shown.length })
  }

  async function remove() {
    if (!del) return
    setBusy(true)
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', del.id)
    setBusy(false)
    if (error) return toast('err', `Not removed: ${error.message}`)
    void logAction('subscriber.delete', 'newsletter', del.id)
    toast('ok', 'Subscriber removed.')
    setDel(null)
    reload()
  }

  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>Sign-ups are stored here only. No newsletter provider is connected yet, so nothing is sent automatically.</p>
      <div className="filters">
        <input className="input" type="search" placeholder="Search email" aria-label="Search subscribers" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" disabled={!shown.length} onClick={exportCsv}>Export CSV</button>
        <button className="btn" disabled={!shown.length} onClick={async () => toast((await copyText(shown.map((s) => s.email).join(', '))) ? 'ok' : 'err', 'Emails copied')}>Copy emails</button>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && data.length === 0 && <Empty title="No subscribers yet">People who join the newsletter on the public site will appear here.</Empty>}
      {data && data.length > 0 && shown.length === 0 && <Empty title="No subscribers match your search" />}
      {shown.length > 0 && (
        <div className="rows">
          {shown.map((s) => (
            <div key={s.id} className="row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center' }}>
              <div><strong style={{ overflowWrap: 'anywhere' }}>{s.email}</strong><div className="row__meta"><span>{s.source}</span><span>{fmtDate(s.created_at)}</span></div></div>
              <button className="btn btn--sm btn--danger" onClick={() => setDel(s)}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {del && <Confirm title="Remove this subscriber?" confirmLabel="Remove" busy={busy} onConfirm={() => void remove()} onCancel={() => setDel(null)}>{del.email} will be deleted permanently.</Confirm>}
    </>
  )
}
