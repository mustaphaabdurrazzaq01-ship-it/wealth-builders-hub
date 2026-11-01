import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'ok'; msg: string } | { kind: 'err'; msg: string }

function Result({ s }: { s: Status }) {
  if (s.kind === 'ok') return <div className="notice notice--ok" role="status">{s.msg}</div>
  if (s.kind === 'err') return <div className="notice notice--err" role="alert">{s.msg}</div>
  return null
}

/* ---------- Newsletter ---------- */
export function NewsletterForm({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [email, setEmail] = useState('')
  const [hp, setHp] = useState('')
  const [s, setS] = useState<Status>({ kind: 'idle' })

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (hp) return
    if (!EMAIL_RE.test(email.trim())) return setS({ kind: 'err', msg: 'Enter a valid email address.' })
    setS({ kind: 'sending' })
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() })
    if (error) {
      if (error.code === '23505') return setS({ kind: 'ok', msg: 'You are already on the list.' })
      return setS({ kind: 'err', msg: 'We could not save your email. Please try again in a moment.' })
    }
    setEmail('')
    setS({ kind: 'ok', msg: 'You are on the list. We will email you when new guides are published.' })
  }

  return (
    <form onSubmit={submit} className="form" noValidate>
      <div className="field">
        <label htmlFor="nl-email" className={tone === 'dark' ? 'sr-only' : undefined}>Email address</label>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'minmax(0,1fr)' }} className="nl-row">
          <input id="nl-email" className="input" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={s.kind === 'err'} />
          <button className="btn btn--primary" disabled={s.kind === 'sending'}>{s.kind === 'sending' ? 'Saving…' : 'Subscribe'}</button>
        </div>
      </div>
      <input className="honey" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />
      <Result s={s} />
    </form>
  )
}

/* ---------- Contact ---------- */
const REASONS = ['General question', 'Product support', 'Resource or download problem', 'Partnership or collaboration', 'Affiliate programme', 'Other']

export function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', reason: REASONS[0], message: '' })
  const [hp, setHp] = useState('')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [s, setS] = useState<Status>({ kind: 'idle' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (hp) return
    const er: Record<string, string> = {}
    if (!f.name.trim()) er.name = 'Enter your name.'
    if (!EMAIL_RE.test(f.email.trim())) er.email = 'Enter a valid email address.'
    if (f.message.trim().length < 10) er.message = 'Write at least a sentence so we can help.'
    setErrs(er)
    if (Object.keys(er).length) return
    setS({ kind: 'sending' })
    const { error } = await supabase.from('contact_messages').insert({ name: f.name.trim(), email: f.email.trim(), reason: f.reason, message: f.message.trim() })
    if (error) return setS({ kind: 'err', msg: 'Your message was not saved. Please try again, nothing was sent.' })
    setF({ name: '', email: '', reason: REASONS[0], message: '' })
    setS({ kind: 'ok', msg: 'Message received and saved. We will reply to the email you gave us.' })
  }

  return (
    <form onSubmit={submit} className="form" noValidate>
      <div className="row-2">
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" className="input" autoComplete="name" value={f.name} onChange={set('name')} aria-invalid={!!errs.name} />
          {errs.name && <span className="field-error">{errs.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={!!errs.email} />
          {errs.email && <span className="field-error">{errs.email}</span>}
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-reason">Reason for contact</label>
        <select id="c-reason" className="select" value={f.reason} onChange={set('reason')}>
          {REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="c-msg">Message</label>
        <textarea id="c-msg" className="textarea" value={f.message} onChange={set('message')} aria-invalid={!!errs.message} />
        {errs.message && <span className="field-error">{errs.message}</span>}
      </div>
      <input className="honey" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="company" />
      <Result s={s} />
      <button className="btn btn--primary" disabled={s.kind === 'sending'}>{s.kind === 'sending' ? 'Sending…' : 'Send message'}</button>
    </form>
  )
}

/* ---------- Affiliate application ---------- */
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Facebook', 'WhatsApp', 'Telegram', 'Blog or website', 'Other']
const AUDIENCE = ['Under 1,000', '1,000 to 5,000', '5,000 to 20,000', '20,000 to 100,000', 'Over 100,000', 'No audience yet']

export function AffiliateForm() {
  const [f, setF] = useState({ full_name: '', email: '', country: '', whatsapp: '', social_link: '', audience_size: '', message: '', agreed: false })
  const [platforms, setPlatforms] = useState<string[]>([])
  const [hp, setHp] = useState('')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [s, setS] = useState<Status>({ kind: 'idle' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))
  const toggle = (p: string) => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (hp) return
    const er: Record<string, string> = {}
    if (f.full_name.trim().length < 2) er.full_name = 'Enter your full name.'
    if (!EMAIL_RE.test(f.email.trim())) er.email = 'Enter a valid email address.'
    if (f.country.trim().length < 2) er.country = 'Enter your country.'
    if (f.whatsapp && !/^[+\d][\d\s()-]{6,20}$/.test(f.whatsapp.trim())) er.whatsapp = 'Use digits with an optional + prefix.'
    if (!platforms.length) er.platforms = 'Choose at least one platform.'
    if (!/^https?:\/\/\S+\.\S+/i.test(f.social_link.trim())) er.social_link = 'Paste a link that starts with https://'
    if (!f.audience_size) er.audience_size = 'Choose your audience size.'
    if (f.message.trim().length < 30) er.message = 'Describe your plan in at least a couple of sentences.'
    if (!f.agreed) er.agreed = 'You need to agree to the programme rules.'
    setErrs(er)
    if (Object.keys(er).length) return

    setS({ kind: 'sending' })
    const { error } = await supabase.from('affiliate_applications').insert({
      full_name: f.full_name.trim(),
      email: f.email.trim().toLowerCase(),
      country: f.country.trim(),
      whatsapp: f.whatsapp.trim() || null,
      platforms,
      social_link: f.social_link.trim(),
      audience_size: f.audience_size,
      message: f.message.trim(),
      agreed_to_terms: true,
      status: 'pending',
    })
    if (error) {
      if (error.code === '23505') return setS({ kind: 'err', msg: 'An application with this email address already exists. We review each one, so there is no need to apply twice.' })
      return setS({ kind: 'err', msg: 'Your application was not saved. Please try again, nothing was submitted.' })
    }
    setS({ kind: 'ok', msg: 'Application received. We review every application by hand and will contact you at the email you gave. Approval is not guaranteed.' })
  }

  if (s.kind === 'ok') return <Result s={s} />

  return (
    <form onSubmit={submit} className="form" noValidate>
      <div className="row-2">
        <div className="field">
          <label htmlFor="a-name">Full name</label>
          <input id="a-name" className="input" autoComplete="name" value={f.full_name} onChange={set('full_name')} aria-invalid={!!errs.full_name} />
          {errs.full_name && <span className="field-error">{errs.full_name}</span>}
        </div>
        <div className="field">
          <label htmlFor="a-email">Email</label>
          <input id="a-email" className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={!!errs.email} />
          {errs.email && <span className="field-error">{errs.email}</span>}
        </div>
      </div>
      <div className="row-2">
        <div className="field">
          <label htmlFor="a-country">Country</label>
          <input id="a-country" className="input" autoComplete="country-name" value={f.country} onChange={set('country')} aria-invalid={!!errs.country} />
          {errs.country && <span className="field-error">{errs.country}</span>}
        </div>
        <div className="field">
          <label htmlFor="a-wa">WhatsApp number <span className="muted">(optional)</span></label>
          <input id="a-wa" className="input" type="tel" autoComplete="tel" placeholder="+234 801 234 5678" value={f.whatsapp} onChange={set('whatsapp')} aria-invalid={!!errs.whatsapp} />
          {errs.whatsapp && <span className="field-error">{errs.whatsapp}</span>}
        </div>
      </div>
      <fieldset className="field">
        <legend>Main platforms you use</legend>
        <div className="checks">
          {PLATFORMS.map((p) => (
            <label className="check" key={p}>
              <input type="checkbox" checked={platforms.includes(p)} onChange={() => toggle(p)} /> {p}
            </label>
          ))}
        </div>
        {errs.platforms && <span className="field-error">{errs.platforms}</span>}
      </fieldset>
      <div className="row-2">
        <div className="field">
          <label htmlFor="a-link">Link to your main profile or site</label>
          <input id="a-link" className="input" type="url" placeholder="https://" value={f.social_link} onChange={set('social_link')} aria-invalid={!!errs.social_link} />
          {errs.social_link && <span className="field-error">{errs.social_link}</span>}
        </div>
        <div className="field">
          <label htmlFor="a-aud">Audience size</label>
          <select id="a-aud" className="select" value={f.audience_size} onChange={set('audience_size')} aria-invalid={!!errs.audience_size}>
            <option value="">Choose one</option>
            {AUDIENCE.map((a) => <option key={a}>{a}</option>)}
          </select>
          {errs.audience_size && <span className="field-error">{errs.audience_size}</span>}
        </div>
      </div>
      <div className="field">
        <label htmlFor="a-plan">How do you plan to promote?</label>
        <textarea id="a-plan" className="textarea" value={f.message} onChange={set('message')} aria-invalid={!!errs.message} />
        <span className="hint">Say who you will reach, on which channels, and how you will stay honest about what the products can and cannot do.</span>
        {errs.message && <span className="field-error">{errs.message}</span>}
      </div>
      <div className="field">
        <label className="check" style={{ alignItems: 'flex-start' }}>
          <input type="checkbox" checked={f.agreed} onChange={(e) => setF((p) => ({ ...p, agreed: e.target.checked }))} style={{ marginTop: 3 }} />
          <span>I have read the promotion guidelines on this page and agree to promote honestly, with no income guarantees.</span>
        </label>
        {errs.agreed && <span className="field-error">{errs.agreed}</span>}
      </div>
      <input className="honey" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="company" />
      <Result s={s} />
      <button className="btn btn--primary" disabled={s.kind === 'sending'}>{s.kind === 'sending' ? 'Submitting…' : 'Submit application'}</button>
    </form>
  )
}
