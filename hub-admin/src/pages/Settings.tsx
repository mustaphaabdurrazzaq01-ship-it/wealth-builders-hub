import { useEffect, useState } from 'react'
import { ErrorBox, Loading, PageHead } from '../components/ui'
import { logAction, useAuth } from '../lib/auth'
import { useAsync } from '../lib/hooks'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'

interface Site { name: string; tagline: string; contact_email: string }
interface Slot { id: string; slot: string; label: string; provider: string; enabled: boolean; config: { code?: string } }
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function Settings() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [s, a] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle(),
      supabase.from('ad_placements').select('id,slot,label,provider,enabled,config').order('slot'),
    ])
    if (s.error) throw new Error(s.error.message)
    if (a.error) throw new Error(a.error.message)
    const v = (s.data?.value ?? {}) as Partial<Site>
    return { site: { name: v.name ?? '', tagline: v.tagline ?? '', contact_email: v.contact_email ?? '' }, slots: (a.data ?? []) as Slot[] }
  }, [])

  return (
    <>
      <PageHead title="Site settings" sub="Public site details and advertising placements." />
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && (
        <>
          <SiteForm initial={data.site} />
          <div className="card">
            <h2 style={{ marginBottom: 6 }}>Advertising placements</h2>
            <div className="alert alert--info" style={{ marginBottom: 12 }}>
              Advertising is off. The public site does not load any advertising code yet, so saving a publisher code here only stores it. Nothing reaches visitors until the public site is updated to display approved ad code.
            </div>
            {data.slots.map((s) => <SlotRow key={s.id} slot={s} onSaved={reload} />)}
          </div>
        </>
      )}
    </>
  )
}

function SiteForm({ initial }: { initial: Site }) {
  const { session } = useAuth()
  const toast = useToast()
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => setF(initial), [initial])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (f.name.trim().length < 2) return setErr('Enter the site name.')
    if (f.contact_email.trim() && !EMAIL_RE.test(f.contact_email.trim())) return setErr('Enter a valid contact email or leave it empty.')
    setErr(null)
    setBusy(true)
    const value = { name: f.name.trim(), tagline: f.tagline.trim(), contact_email: f.contact_email.trim() }
    const { error } = await supabase.from('site_settings').upsert({ key: 'site', value, is_public: true, updated_at: new Date().toISOString(), updated_by: session?.user.id ?? null })
    setBusy(false)
    if (error) return toast('err', `Not saved: ${error.message}`)
    void logAction('settings.update', 'site_settings', 'site', { fields: Object.keys(value) })
    toast('ok', 'Settings saved.')
  }

  return (
    <form className="card" onSubmit={save}>
      <h2 style={{ marginBottom: 12 }}>Site details</h2>
      <div className="two">
        <div className="field"><label htmlFor="sn">Site name</label><input id="sn" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label htmlFor="st">Tagline</label><input id="st" className="input" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></div>
      </div>
      <div className="field"><label htmlFor="ce">Contact email</label><input id="ce" className="input" type="email" value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} /><span className="hint">These details are public. Contact form messages are stored in the database whether or not an email is set.</span></div>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
    </form>
  )
}

function SlotRow({ slot, onSaved }: { slot: Slot; onSaved: () => void }) {
  const toast = useToast()
  const [code, setCode] = useState(slot.config?.code ?? '')
  const [busy, setBusy] = useState(false)

  async function save(enabled: boolean) {
    if (enabled && !code.trim()) return toast('err', 'Add the approved publisher code before turning this placement on.')
    setBusy(true)
    const { error } = await supabase.from('ad_placements').update({ enabled, config: { ...slot.config, code: code.trim() }, updated_at: new Date().toISOString() }).eq('id', slot.id)
    setBusy(false)
    if (error) return toast('err', `Not saved: ${error.message}`)
    void logAction('ads.update', 'ad_placement', slot.id, { slot: slot.slot, enabled })
    toast('ok', enabled ? 'Placement saved and switched on.' : 'Placement saved and off.')
    onSaved()
  }

  return (
    <div className="row" style={{ gap: 8 }}>
      <div className="row__meta"><strong style={{ color: 'var(--navy)' }}>{slot.label}</strong><span className={`pill pill--${slot.enabled ? 'ok' : 'neutral'}`}>{slot.enabled ? 'On' : 'Off'}</span><span>{slot.provider}</span></div>
      <div className="field" style={{ margin: 0 }}>
        <label htmlFor={`c-${slot.id}`}>Approved publisher code</label>
        <textarea id={`c-${slot.id}`} className="textarea" style={{ minHeight: 70, fontFamily: 'monospace' }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code from your approved ad account" />
      </div>
      <div className="tabs" style={{ marginBottom: 0 }}>
        <button className="btn btn--sm" disabled={busy} onClick={() => void save(slot.enabled)}>Save code</button>
        {slot.enabled
          ? <button className="btn btn--sm" disabled={busy} onClick={() => void save(false)}>Turn off</button>
          : <button className="btn btn--sm btn--primary" disabled={busy} onClick={() => void save(true)}>Turn on</button>}
      </div>
    </div>
  )
}
