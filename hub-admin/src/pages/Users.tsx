import { useState } from 'react'
import { Empty, ErrorBox, Loading, PageHead } from '../components/ui'
import { logAction, useAuth, type Role } from '../lib/auth'
import { fmtDate, useAsync } from '../lib/hooks'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'

interface P { id: string; display_name: string | null; role: Role; created_at: string }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function Users() {
  const { session } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(async () => {
    const { data, error } = await supabase.from('profiles').select('id,display_name,role,created_at').order('created_at')
    if (error) throw new Error(error.message)
    return (data ?? []) as P[]
  }, [])
  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<Role>('editor')
  const [adding, setAdding] = useState(false)

  async function save(p: P, patch: Partial<Pick<P, 'display_name' | 'role'>>) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', p.id)
    if (error) return toast('err', `Not saved: ${error.message}`)
    void logAction('profile.update', 'profile', p.id, { fields: Object.keys(patch) })
    toast('ok', 'Profile saved.')
    reload()
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!UUID.test(newId.trim())) return toast('err', 'Enter the user ID exactly as shown in Supabase Authentication.')
    setAdding(true)
    const { error } = await supabase.from('profiles').insert({ id: newId.trim(), display_name: newName.trim() || null, role: newRole })
    setAdding(false)
    if (error) return toast('err', /foreign key/i.test(error.message) ? 'No sign-in account has that ID. Create the user in Supabase Authentication first.' : /duplicate/i.test(error.message) ? 'That user already has a profile.' : `Not added: ${error.message}`)
    void logAction('profile.create', 'profile', newId.trim(), { role: newRole })
    toast('ok', 'Profile added.')
    setNewId(''); setNewName('')
    reload()
  }

  return (
    <>
      <PageHead title="Users and profiles" sub="Admins manage everything. Editors can write articles and resources only. Roles are enforced by the database, not just this screen." />
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && data.length === 0 && <Empty title="No profiles" />}
      {data && data.length > 0 && (
        <div className="rows">
          {data.map((p) => {
            const me = p.id === session?.user.id
            return (
              <div key={p.id} className="row" style={{ gap: 10 }}>
                <div className="row__meta"><strong style={{ color: 'var(--navy)' }}>{p.display_name || 'No display name'}</strong>{me && <span className="pill pill--info">You</span>}<span>Joined {fmtDate(p.created_at)}</span></div>
                <div className="filters" style={{ margin: 0 }}>
                  <input className="input" aria-label="Display name" defaultValue={p.display_name ?? ''} placeholder="Display name" onBlur={(e) => { const v = e.target.value.trim(); if (v !== (p.display_name ?? '')) void save(p, { display_name: v || null }) }} />
                  <select className="select" aria-label="Role" value={p.role} disabled={me} title={me ? 'You cannot change your own role.' : undefined} onChange={(e) => void save(p, { role: e.target.value as Role })}>
                    <option value="admin">Admin</option><option value="editor">Editor</option>
                  </select>
                </div>
                {me && <span className="hint">You cannot change your own role, so you cannot lock yourself out.</span>}
              </div>
            )
          })}
        </div>
      )}
      <form className="card" onSubmit={add} style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 6 }}>Give an existing account access</h2>
        <p className="hint" style={{ marginTop: 0 }}>This screen cannot create sign-in accounts, because that needs a server-side key that is never put in the browser. Create the user in Supabase, Authentication, Users, then paste their user ID here.</p>
        <div className="two">
          <div className="field"><label htmlFor="uid">User ID</label><input id="uid" className="input" value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" /></div>
          <div className="field"><label htmlFor="un">Display name</label><input id="un" className="input" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
        </div>
        <div className="field" style={{ maxWidth: 220 }}><label htmlFor="ur">Role</label><select id="ur" className="select" value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
        <button className="btn btn--primary" disabled={adding}>{adding ? 'Adding…' : 'Add profile'}</button>
      </form>
    </>
  )
}
