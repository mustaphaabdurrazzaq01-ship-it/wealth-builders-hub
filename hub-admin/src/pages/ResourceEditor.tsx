import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Confirm, ErrorBox, FileField, Loading, PageHead, StatusPill, copyText } from '../components/ui'
import { logAction, useAuth } from '../lib/auth'
import { CATEGORIES } from '../lib/categories'
import { errMessage, publicFileUrl, safeName, supabase, uploadFile } from '../lib/supabase'
import { useToast } from '../lib/toast'

const TYPES = ['guide', 'worksheet', 'checklist', 'template', 'pdf', 'other']
const FILE_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|epub|txt|png|jpe?g)$/i
const MAX_FILE = 25 * 1024 * 1024

interface Form { title: string; description: string; resource_type: string; category: string; status: 'draft' | 'published' | 'archived'; file_url: string | null; cover_image_url: string | null; file_size_bytes: number | null }
const EMPTY: Form = { title: '', description: '', resource_type: 'guide', category: '', status: 'draft', file_url: null, cover_image_url: null, file_size_bytes: null }

export default function ResourceEditor() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const toast = useToast()
  const { isAdmin } = useAuth()
  const [f, setF] = useState<Form>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (isNew) return
    let live = true
    supabase.from('resources').select('title,description,resource_type,category,status,file_url,cover_image_url,file_size_bytes').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (!live) return
      if (error) setLoadErr(error.message)
      else if (!data) setLoadErr('This resource does not exist or you do not have access to it.')
      else setF({ ...EMPTY, ...data, description: data.description ?? '', category: data.category ?? '', resource_type: data.resource_type ?? 'guide' } as Form)
      setLoading(false)
    })
    return () => { live = false }
  }, [id, isNew])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))

  async function save(next: Form['status']) {
    const e: Record<string, string> = {}
    if (f.title.trim().length < 3) e.title = 'Enter a title of at least 3 characters.'
    if (isNew && !file) e.file = 'Choose the file people will download.'
    if (file && !FILE_RE.test(file.name)) e.file = 'Use PDF, Office, ZIP, EPUB, TXT or image files.'
    if (file && file.size > MAX_FILE) e.file = 'File must be 25 MB or smaller.'
    if (next === 'published' && !file && !f.file_url) e.file = 'A published resource needs a file.'
    setErrs(e)
    if (Object.keys(e).length) return toast('err', 'Fix the highlighted fields first.')

    setSaving(true)
    let uploadedFile: string | null = null
    let uploadedCover: string | null = null
    try {
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error('Your session expired. Sign in again.')
      if (file) uploadedFile = await uploadFile('hub-resources', `${uid}/${Date.now()}-${safeName(file.name)}`, file)
      if (cover) {
        if (cover.size > 3 * 1024 * 1024 || !/^image\/(png|jpe?g|webp)$/.test(cover.type)) throw new Error('Cover must be a PNG, JPG or WebP image up to 3 MB.')
        uploadedCover = await uploadFile('product-covers', `resources/${Date.now()}-${safeName(cover.name)}`, cover)
      }
      const row = {
        title: f.title.trim(), description: f.description.trim(), resource_type: f.resource_type, category: f.category || null, status: next,
        file_url: uploadedFile ?? f.file_url, file_size_bytes: file ? file.size : f.file_size_bytes, cover_image_url: uploadedCover ?? f.cover_image_url, updated_at: new Date().toISOString(),
      }
      if (isNew) {
        const { data, error } = await supabase.from('resources').insert(row).select('id').single()
        if (error) throw error
        void logAction(next === 'published' ? 'resource.publish' : 'resource.upload', 'resource', data.id, { title: row.title })
        toast('ok', 'Resource saved.')
        nav(`/resources/${data.id}`, { replace: true })
      } else {
        const oldFile = f.file_url
        const { error } = await supabase.from('resources').update(row).eq('id', id)
        if (error) throw error
        if (uploadedFile && oldFile && oldFile !== uploadedFile) {
          if (isAdmin) await supabase.storage.from('hub-resources').remove([oldFile])
          else toast('ok', 'File replaced. An administrator can remove the old file from storage.')
        }
        void logAction(next === 'published' && f.status !== 'published' ? 'resource.publish' : 'resource.update', 'resource', id, { title: row.title })
        setF((p) => ({ ...p, ...row }) as Form)
        setFile(null); setCover(null)
        toast('ok', next === 'published' ? 'Saved and live.' : 'Saved.')
      }
    } catch (err) {
      // A failed save must not leave a misleading record or a stray upload behind.
      if (uploadedFile && isAdmin) await supabase.storage.from('hub-resources').remove([uploadedFile])
      toast('err', `Not saved: ${errMessage(err)}`)
    } finally { setSaving(false) }
  }

  async function remove() {
    setSaving(true)
    const path = f.file_url
    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (error) { setSaving(false); return toast('err', `Not deleted: ${error.message}`) }
    let warn = ''
    if (path && !/^https?:\/\//i.test(path)) {
      const r = await supabase.storage.from('hub-resources').remove([path])
      if (r.error) warn = ' The file could not be removed from storage.'
    }
    void logAction('resource.delete', 'resource', id, { title: f.title })
    setSaving(false)
    toast('ok', `Resource deleted.${warn}`)
    nav('/resources', { replace: true })
  }

  if (loading) return <Loading />
  if (loadErr) return <ErrorBox message={loadErr} />
  const link = publicFileUrl('hub-resources', f.file_url)
  const coverSrc = publicFileUrl('product-covers', f.cover_image_url)

  return (
    <>
      <PageHead title={isNew ? 'Upload resource' : 'Edit resource'} actions={!isNew && <StatusPill status={f.status} />} />
      <div className="editor">
        <div className="card">
          <div className="field"><label htmlFor="t">Title</label><input id="t" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errs.title} />{errs.title && <span className="err">{errs.title}</span>}</div>
          <div className="field"><label htmlFor="d">Description</label><textarea id="d" className="textarea" value={f.description} onChange={(e) => set('description', e.target.value)} /><span className="hint">Say what the file contains and who it helps.</span></div>
          <div className="two">
            <div className="field"><label htmlFor="ty">Type</label><select id="ty" className="select" value={f.resource_type} onChange={(e) => set('resource_type', e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label htmlFor="ca">Category</label><select id="ca" className="select" value={f.category} onChange={(e) => set('category', e.target.value)}><option value="">None</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <FileField label={isNew ? 'File' : 'Replace file'} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.epub,.txt,.png,.jpg,.jpeg" hint="Up to 25 MB." current={f.file_url ? f.file_url.split('/').pop() : null} onPick={setFile} />
          {errs.file && <span className="err" style={{ marginTop: -10, display: 'block', marginBottom: 12 }}>{errs.file}</span>}
        </div>
        <div className="card">
          {coverSrc && !cover && <img className="thumb" src={coverSrc} alt="Current cover" style={{ marginBottom: 12 }} />}
          <FileField label="Cover image (optional)" accept="image/png,image/jpeg,image/webp" hint="PNG, JPG or WebP, up to 3 MB." onPick={setCover} />
          {link && (
            <div className="field">
              <label>Download link</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a className="btn btn--sm" href={link} target="_blank" rel="noopener noreferrer">Open file</a>
                <button className="btn btn--sm" onClick={async () => toast((await copyText(link)) ? 'ok' : 'err', 'Link copied')}>Copy link</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="sticky-actions">
        <button className="btn" disabled={saving} onClick={() => save('draft')}>{f.status === 'published' && !isNew ? 'Unpublish (save as draft)' : 'Save draft'}</button>
        <button className="btn btn--primary" disabled={saving} onClick={() => save('published')}>{saving ? 'Saving…' : f.status === 'published' ? 'Save changes' : 'Publish'}</button>
        {!isNew && isAdmin && <button className="btn btn--danger" disabled={saving} style={{ marginLeft: 'auto' }} onClick={() => setConfirmDel(true)}>Delete</button>}
      </div>
      {confirmDel && <Confirm title="Delete this resource?" busy={saving} onCancel={() => setConfirmDel(false)} onConfirm={remove}>"{f.title}" and its uploaded file will be permanently removed.</Confirm>}
    </>
  )
}
