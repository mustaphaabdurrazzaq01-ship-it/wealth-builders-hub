import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Confirm, ErrorBox, FileField, Loading, PageHead, StatusPill, copyText } from '../components/ui'
import { logAction, useAuth } from '../lib/auth'
import { CATEGORIES } from '../lib/categories'
import { PUBLIC_SITE_URL, errMessage, publicFileUrl, safeName, slugify, supabase, uploadFile } from '../lib/supabase'
import { useToast } from '../lib/toast'

interface Form {
  title: string; slug: string; category: string; excerpt: string; content: string; cover_image_url: string | null
  seo_title: string; seo_description: string; status: 'draft' | 'published' | 'archived'; author_name: string; published_at: string | null
}
const EMPTY: Form = { title: '', slug: '', category: CATEGORIES[0], excerpt: '', content: '', cover_image_url: null, seo_title: '', seo_description: '', status: 'draft', author_name: 'Boss Mustapha', published_at: null }
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

function renderPreview(src: string) {
  return src.split(/\n{2,}/).map((b, i) => {
    const h = /^(#{1,3})\s+(.*)$/.exec(b.trim())
    if (h) return h[1].length === 3 ? <h3 key={i}>{h[2]}</h3> : <h2 key={i}>{h[2]}</h2>
    return <p key={i} style={{ whiteSpace: 'pre-line' }}>{b}</p>
  })
}

export default function ArticleEditor() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const toast = useToast()
  const { isAdmin } = useAuth()
  const [f, setF] = useState<Form>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [cover, setCover] = useState<File | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (isNew) return
    let live = true
    supabase.from('articles').select('title,slug,category,excerpt,content,cover_image_url,seo_title,seo_description,status,author_name,published_at').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (!live) return
      if (error) setLoadErr(error.message)
      else if (!data) setLoadErr('This article does not exist or you do not have access to it.')
      else { setF({ ...EMPTY, ...data, category: data.category ?? CATEGORIES[0], excerpt: data.excerpt ?? '', seo_title: data.seo_title ?? '', seo_description: data.seo_description ?? '' } as Form); setSlugTouched(true) }
      setLoading(false)
    })
    return () => { live = false }
  }, [id, isNew])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))
  const onTitle = (v: string) => setF((p) => ({ ...p, title: v, slug: slugTouched ? p.slug : slugify(v) }))

  function validate(next: Form['status']): boolean {
    const e: Record<string, string> = {}
    if (f.title.trim().length < 3) e.title = 'Enter a title of at least 3 characters.'
    if (!SLUG_RE.test(f.slug)) e.slug = 'Use lowercase letters, numbers and single hyphens only.'
    if (next === 'published') {
      if (f.content.trim().length < 50) e.content = 'Write the article before publishing.'
      if (!f.excerpt.trim()) e.excerpt = 'Add an excerpt before publishing.'
    }
    setErrs(e)
    return Object.keys(e).length === 0
  }

  async function save(next: Form['status']) {
    if (!validate(next)) return toast('err', 'Fix the highlighted fields first.')
    setSaving(true)
    try {
      let coverPath = f.cover_image_url
      if (cover) {
        if (cover.size > 3 * 1024 * 1024) throw new Error('Cover image must be 3 MB or smaller.')
        if (!/^image\/(png|jpe?g|webp)$/.test(cover.type)) throw new Error('Cover must be a PNG, JPG or WebP image.')
        coverPath = await uploadFile('product-covers', `articles/${Date.now()}-${safeName(cover.name)}`, cover)
      }
      const words = f.content.trim().split(/\s+/).filter(Boolean).length
      const row = {
        title: f.title.trim(), slug: f.slug, category: f.category, excerpt: f.excerpt.trim(), content: f.content,
        cover_image_url: coverPath, seo_title: f.seo_title.trim() || null, seo_description: f.seo_description.trim() || null,
        status: next, author_name: f.author_name.trim() || 'Boss Mustapha', reading_minutes: Math.max(1, Math.round(words / 200)),
        published_at: next === 'published' ? f.published_at ?? new Date().toISOString() : f.published_at,
        updated_at: new Date().toISOString(),
      }
      if (isNew) {
        const { data: u } = await supabase.auth.getUser()
        const { data, error } = await supabase.from('articles').insert({ ...row, created_by: u.user?.id }).select('id').single()
        if (error) throw error
        void logAction(next === 'published' ? 'article.publish' : 'article.create', 'article', data.id, { slug: row.slug })
        toast('ok', next === 'published' ? 'Article published.' : 'Draft saved.')
        nav(`/articles/${data.id}`, { replace: true })
      } else {
        const { error } = await supabase.from('articles').update(row).eq('id', id)
        if (error) throw error
        const action = next === 'published' && f.status !== 'published' ? 'article.publish' : f.status === 'published' && next !== 'published' ? 'article.unpublish' : 'article.update'
        void logAction(action, 'article', id, { slug: row.slug })
        setF((p) => ({ ...p, ...row, cover_image_url: coverPath, seo_title: row.seo_title ?? '', seo_description: row.seo_description ?? '' }) as Form)
        setCover(null)
        toast('ok', next === 'published' ? 'Saved and live.' : next === 'draft' ? 'Saved as draft.' : 'Saved.')
      }
    } catch (e) {
      const m = errMessage(e)
      if (/duplicate key|articles_slug/i.test(m)) { setErrs({ slug: 'Another article already uses this slug.' }); toast('err', 'That slug is taken.') }
      else toast('err', `Not saved: ${m}`)
    } finally { setSaving(false) }
  }

  async function remove() {
    setSaving(true)
    const { error } = await supabase.from('articles').delete().eq('id', id)
    setSaving(false)
    if (error) return toast('err', `Not deleted: ${error.message}`)
    void logAction('article.delete', 'article', id, { slug: f.slug })
    toast('ok', 'Article deleted.')
    nav('/articles', { replace: true })
  }

  if (loading) return <Loading />
  if (loadErr) return <ErrorBox message={loadErr} />
  const coverSrc = publicFileUrl('product-covers', f.cover_image_url)
  const liveUrl = PUBLIC_SITE_URL && f.status === 'published' ? `${PUBLIC_SITE_URL}/articles/${f.slug}` : null

  return (
    <>
      <PageHead title={isNew ? 'New article' : 'Edit article'} sub={isNew ? undefined : `Currently ${f.status}`} actions={!isNew && <StatusPill status={f.status} />} />
      <div className="editor">
        <div>
          <div className="card">
            <div className="field"><label htmlFor="t">Title</label><input id="t" className="input" value={f.title} onChange={(e) => onTitle(e.target.value)} aria-invalid={!!errs.title} />{errs.title && <span className="err">{errs.title}</span>}</div>
            <div className="field"><label htmlFor="s">Slug</label><input id="s" className="input" value={f.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)) }} aria-invalid={!!errs.slug} /><span className="hint">The article URL will be /articles/{f.slug || 'your-slug'}</span>{errs.slug && <span className="err">{errs.slug}</span>}</div>
            <div className="field"><label htmlFor="x">Excerpt</label><textarea id="x" className="textarea" style={{ minHeight: 80 }} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} aria-invalid={!!errs.excerpt} /><span className="hint">One or two sentences shown on cards and in search results.</span>{errs.excerpt && <span className="err">{errs.excerpt}</span>}</div>
            <div className="field">
              <label htmlFor="c" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Content</span><button type="button" className="linklike" onClick={() => setPreview((p) => !p)}>{preview ? 'Edit' : 'Preview'}</button></label>
              {preview ? <div className="preview">{renderPreview(f.content) }</div> : <textarea id="c" className="textarea textarea--tall" value={f.content} onChange={(e) => set('content', e.target.value)} aria-invalid={!!errs.content} />}
              <span className="hint">Use # Heading, - bullet lists, **bold**, *italic* and [links](https://…).</span>{errs.content && <span className="err">{errs.content}</span>}
            </div>
          </div>
          <div className="card">
            <h2 style={{ marginBottom: 12 }}>Search appearance</h2>
            <div className="field"><label htmlFor="st">SEO title</label><input id="st" className="input" value={f.seo_title} onChange={(e) => set('seo_title', e.target.value)} /><span className="hint">{f.seo_title.length}/60 characters. Leave blank to use the article title.</span></div>
            <div className="field"><label htmlFor="sd">SEO description</label><textarea id="sd" className="textarea" style={{ minHeight: 80 }} value={f.seo_description} onChange={(e) => set('seo_description', e.target.value)} /><span className="hint">{f.seo_description.length}/160 characters.</span></div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="field"><label htmlFor="cat">Category</label><select id="cat" className="select" value={f.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label htmlFor="au">Author name</label><input id="au" className="input" value={f.author_name} onChange={(e) => set('author_name', e.target.value)} /></div>
            {coverSrc && !cover && <img className="thumb" src={coverSrc} alt="Current cover" style={{ marginBottom: 12 }} />}
            <FileField label="Cover image" accept="image/png,image/jpeg,image/webp" hint="PNG, JPG or WebP, up to 3 MB. 1600 × 1000 works well." onPick={setCover} />
            {liveUrl && <p style={{ margin: 0 }}><a href={liveUrl} target="_blank" rel="noopener noreferrer">View live page</a> · <button className="linklike" onClick={async () => toast((await copyText(liveUrl)) ? 'ok' : 'err', 'Link copied')}>Copy link</button></p>}
            {!liveUrl && f.status === 'published' && <p className="hint" style={{ margin: 0 }}>Set VITE_PUBLIC_SITE_URL to get a live link here.</p>}
          </div>
        </div>
      </div>
      <div className="sticky-actions">
        <button className="btn" disabled={saving} onClick={() => save(f.status === 'published' ? 'draft' : 'draft')}>{f.status === 'published' && !isNew ? 'Unpublish (save as draft)' : 'Save draft'}</button>
        <button className="btn btn--primary" disabled={saving} onClick={() => save('published')}>{saving ? 'Saving…' : f.status === 'published' ? 'Save changes' : 'Publish'}</button>
        {!isNew && f.status !== 'archived' && <button className="btn" disabled={saving} onClick={() => save('archived')}>Archive</button>}
        {!isNew && isAdmin && <button className="btn btn--danger" disabled={saving} style={{ marginLeft: 'auto' }} onClick={() => setConfirmDel(true)}>Delete</button>}
      </div>
      {confirmDel && <Confirm title="Delete this article?" busy={saving} onCancel={() => setConfirmDel(false)} onConfirm={remove}>"{f.title}" will be permanently removed. This cannot be undone.</Confirm>}
    </>
  )
}
