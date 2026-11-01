import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Confirm, ErrorBox, FileField, Loading, PageHead, StatusPill, copyText } from '../components/ui'
import { logAction } from '../lib/auth'
import { CATEGORIES } from '../lib/categories'
import { PUBLIC_SITE_URL, errMessage, publicFileUrl, safeName, slugify, supabase, uploadFile } from '../lib/supabase'
import { useToast } from '../lib/toast'

interface Form {
  title: string; slug: string; description: string; category: string; price: string; currency: string; selar_url: string
  features: string; seo_title: string; seo_description: string; status: 'draft' | 'active' | 'archived'; cover_image_url: string | null
}
const EMPTY: Form = { title: '', slug: '', description: '', category: CATEGORIES[1], price: '', currency: 'USD', selar_url: '', features: '', seo_title: '', seo_description: '', status: 'draft', cover_image_url: null }
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

function checkoutProblem(url: string): string | null {
  if (!url.trim()) return 'Paste the Selar checkout link.'
  try {
    const u = new URL(url.trim())
    if (u.protocol !== 'https:') return 'The checkout link must start with https://'
  } catch {
    return 'That is not a valid link.'
  }
  return null
}

export default function ProductEditor() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const toast = useToast()
  const [f, setF] = useState<Form>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [cover, setCover] = useState<File | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (isNew) return
    let live = true
    supabase.from('products').select('title,slug,description,category,price,currency,selar_url,features,seo_title,seo_description,status,cover_image_url').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (!live) return
      if (error) setLoadErr(error.message)
      else if (!data) setLoadErr('This product does not exist.')
      else { setF({ ...EMPTY, ...data, description: data.description ?? '', category: data.category ?? '', price: data.price === null ? '' : String(data.price), selar_url: data.selar_url ?? '', features: (data.features ?? []).join('\n'), seo_title: data.seo_title ?? '', seo_description: data.seo_description ?? '' } as Form); setSlugTouched(true) }
      setLoading(false)
    })
    return () => { live = false }
  }, [id, isNew])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))
  const onTitle = (v: string) => setF((p) => ({ ...p, title: v, slug: slugTouched ? p.slug : slugify(v) }))
  const host = (() => { try { return new URL(f.selar_url.trim()).hostname } catch { return '' } })()
  const offSelar = !!host && !/(^|\.)selar\.(co|com)$/i.test(host)

  async function save(next: Form['status']) {
    const e: Record<string, string> = {}
    if (f.title.trim().length < 3) e.title = 'Enter a title of at least 3 characters.'
    if (!SLUG_RE.test(f.slug)) e.slug = 'Use lowercase letters, numbers and single hyphens only.'
    if (f.price !== '' && (isNaN(Number(f.price)) || Number(f.price) < 0)) e.price = 'Enter a price of 0 or more.'
    if (f.selar_url.trim()) { const p = checkoutProblem(f.selar_url); if (p) e.selar_url = p }
    if (next === 'active') {
      const p = checkoutProblem(f.selar_url); if (p) e.selar_url = p
      if (!f.description.trim()) e.description = 'Add a description before publishing.'
      if (f.price === '') e.price = 'Set a price before publishing (use 0 for free).'
    }
    setErrs(e)
    if (Object.keys(e).length) return toast('err', next === 'active' && e.selar_url ? 'A published product needs a valid https checkout link.' : 'Fix the highlighted fields first.')

    setSaving(true)
    try {
      let coverPath = f.cover_image_url
      if (cover) {
        if (cover.size > 3 * 1024 * 1024 || !/^image\/(png|jpe?g|webp)$/.test(cover.type)) throw new Error('Cover must be a PNG, JPG or WebP image up to 3 MB.')
        coverPath = await uploadFile('product-covers', `products/${Date.now()}-${safeName(cover.name)}`, cover)
      }
      const row = {
        title: f.title.trim(), slug: f.slug, description: f.description.trim(), category: f.category || null, price: f.price === '' ? null : Number(f.price), currency: f.currency,
        selar_url: f.selar_url.trim() || null, features: f.features.split('\n').map((s) => s.trim()).filter(Boolean), seo_title: f.seo_title.trim() || null,
        seo_description: f.seo_description.trim() || null, status: next, cover_image_url: coverPath, updated_at: new Date().toISOString(),
      }
      if (isNew) {
        const { data, error } = await supabase.from('products').insert(row).select('id').single()
        if (error) throw error
        void logAction(next === 'active' ? 'product.publish' : 'product.create', 'product', data.id, { slug: row.slug })
        toast('ok', next === 'active' ? 'Product published.' : 'Draft saved.')
        nav(`/products/${data.id}`, { replace: true })
      } else {
        const { error } = await supabase.from('products').update(row).eq('id', id)
        if (error) throw error
        const action = next === 'active' && f.status !== 'active' ? 'product.publish' : f.status === 'active' && next !== 'active' ? 'product.unpublish' : 'product.update'
        void logAction(action, 'product', id, { slug: row.slug })
        setF((p) => ({ ...p, status: next, cover_image_url: coverPath }))
        setCover(null)
        toast('ok', next === 'active' ? 'Saved and live on the public site.' : 'Saved.')
      }
    } catch (err) {
      const m = errMessage(err)
      if (/duplicate key|products_slug/i.test(m)) setErrs({ slug: 'Another product already uses this slug.' })
      toast('err', `Not saved: ${/products_active_needs_checkout/.test(m) ? 'a published product needs an https checkout link.' : m}`)
    } finally { setSaving(false) }
  }

  async function remove() {
    setSaving(true)
    const { error } = await supabase.from('products').delete().eq('id', id)
    setSaving(false)
    if (error) return toast('err', `Not deleted: ${error.message}`)
    void logAction('product.delete', 'product', id, { slug: f.slug })
    toast('ok', 'Product deleted.')
    nav('/products', { replace: true })
  }

  if (loading) return <Loading />
  if (loadErr) return <ErrorBox message={loadErr} />
  const coverSrc = publicFileUrl('product-covers', f.cover_image_url)
  const preview = PUBLIC_SITE_URL && f.status === 'active' ? `${PUBLIC_SITE_URL}/products/${f.slug}` : null

  return (
    <>
      <PageHead title={isNew ? 'New product' : 'Edit product'} actions={!isNew && <StatusPill status={f.status} />} />
      <div className="editor">
        <div>
          <div className="card">
            <div className="field"><label htmlFor="t">Title</label><input id="t" className="input" value={f.title} onChange={(e) => onTitle(e.target.value)} aria-invalid={!!errs.title} />{errs.title && <span className="err">{errs.title}</span>}</div>
            <div className="field"><label htmlFor="s">Slug</label><input id="s" className="input" value={f.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)) }} aria-invalid={!!errs.slug} />{errs.slug && <span className="err">{errs.slug}</span>}</div>
            <div className="field"><label htmlFor="d">Description</label><textarea id="d" className="textarea" value={f.description} onChange={(e) => set('description', e.target.value)} aria-invalid={!!errs.description} />{errs.description && <span className="err">{errs.description}</span>}</div>
            <div className="field"><label htmlFor="ft">What is inside</label><textarea id="ft" className="textarea" style={{ minHeight: 100 }} value={f.features} onChange={(e) => set('features', e.target.value)} /><span className="hint">One feature or benefit per line. Be specific and honest.</span></div>
          </div>
          <div className="card">
            <h2 style={{ marginBottom: 12 }}>Checkout</h2>
            <div className="field">
              <label htmlFor="u">Selar checkout link</label>
              <input id="u" className="input" type="url" placeholder="https://selar.co/…" value={f.selar_url} onChange={(e) => set('selar_url', e.target.value)} aria-invalid={!!errs.selar_url} />
              {errs.selar_url && <span className="err">{errs.selar_url}</span>}
              {offSelar && <span className="hint" style={{ color: '#7A5200' }}>This link is not on selar.co or selar.com. Check that it is the right checkout page.</span>}
              {f.selar_url.trim() && !checkoutProblem(f.selar_url) && <span className="hint"><a href={f.selar_url.trim()} target="_blank" rel="noopener noreferrer">Open to test it</a> · <button type="button" className="linklike" onClick={async () => toast((await copyText(f.selar_url.trim())) ? 'ok' : 'err', 'Checkout link copied')}>Copy</button></span>}
            </div>
            <div className="two">
              <div className="field"><label htmlFor="p">Price</label><input id="p" className="input" inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} aria-invalid={!!errs.price} />{errs.price && <span className="err">{errs.price}</span>}</div>
              <div className="field"><label htmlFor="cu">Currency</label><select id="cu" className="select" value={f.currency} onChange={(e) => set('currency', e.target.value)}>{['USD', 'NGN', 'GBP', 'CAD', 'EUR'].map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
          </div>
          <div className="card">
            <h2 style={{ marginBottom: 12 }}>Search appearance</h2>
            <div className="field"><label htmlFor="st">SEO title</label><input id="st" className="input" value={f.seo_title} onChange={(e) => set('seo_title', e.target.value)} /></div>
            <div className="field"><label htmlFor="sd">SEO description</label><textarea id="sd" className="textarea" style={{ minHeight: 80 }} value={f.seo_description} onChange={(e) => set('seo_description', e.target.value)} /><span className="hint">{f.seo_description.length}/160 characters.</span></div>
          </div>
        </div>
        <div className="card">
          <div className="field"><label htmlFor="ca">Category</label><select id="ca" className="select" value={f.category} onChange={(e) => set('category', e.target.value)}><option value="">None</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          {coverSrc && !cover && <img className="thumb" src={coverSrc} alt="Current cover" style={{ marginBottom: 12 }} />}
          <FileField label="Cover image" accept="image/png,image/jpeg,image/webp" hint="PNG, JPG or WebP, up to 3 MB." onPick={setCover} />
          {preview ? <p style={{ margin: 0 }}><a href={preview} target="_blank" rel="noopener noreferrer">View on public site</a></p> : f.status === 'active' ? <p className="hint" style={{ margin: 0 }}>Set VITE_PUBLIC_SITE_URL to get a live link here.</p> : <p className="hint" style={{ margin: 0 }}>Publish the product to see it on the public site.</p>}
        </div>
      </div>
      <div className="sticky-actions">
        <button className="btn" disabled={saving} onClick={() => save('draft')}>{f.status === 'active' && !isNew ? 'Unpublish (save as draft)' : 'Save draft'}</button>
        <button className="btn btn--primary" disabled={saving} onClick={() => save('active')}>{saving ? 'Saving…' : f.status === 'active' ? 'Save changes' : 'Publish'}</button>
        {!isNew && f.status !== 'archived' && <button className="btn" disabled={saving} onClick={() => save('archived')}>Archive</button>}
        {!isNew && <button className="btn btn--danger" disabled={saving} style={{ marginLeft: 'auto' }} onClick={() => setConfirmDel(true)}>Delete</button>}
      </div>
      {confirmDel && <Confirm title="Delete this product?" busy={saving} onCancel={() => setConfirmDel(false)} onConfirm={remove}>"{f.title}" will be permanently removed from the database and the public site.</Confirm>}
    </>
  )
}
