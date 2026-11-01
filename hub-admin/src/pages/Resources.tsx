import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, ErrorBox, Loading, PageHead, StatusPill } from '../components/ui'
import { fmtDate, useAsync } from '../lib/hooks'
import { supabase } from '../lib/supabase'

interface Row { id: string; title: string; status: string; resource_type: string | null; category: string | null; created_at: string }

export default function Resources() {
  const { data, loading, error, reload } = useAsync(async () => {
    const { data, error } = await supabase.from('resources').select('id,title,status,resource_type,category,created_at').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Row[]
  }, [])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const shown = useMemo(() => (data ?? []).filter((r) => (!status || r.status === status) && (!q || r.title.toLowerCase().includes(q.toLowerCase()))), [data, q, status])

  return (
    <>
      <PageHead title="Resources" sub="Downloadable guides, checklists, templates and worksheets." actions={<Link className="btn btn--primary" to="/resources/new">Upload resource</Link>} />
      <div className="filters">
        <input className="input" type="search" placeholder="Search resources" aria-label="Search resources" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && data.length === 0 && <Empty title="No resources yet">Upload a PDF or document with the button above.</Empty>}
      {data && data.length > 0 && shown.length === 0 && <Empty title="No resources match your filters" />}
      {shown.length > 0 && (
        <div className="rows">
          {shown.map((r) => (
            <Link key={r.id} className="row" to={`/resources/${r.id}`}>
              <strong>{r.title}</strong>
              <div className="row__meta"><StatusPill status={r.status} /><span>{r.resource_type ?? 'guide'}</span>{r.category && <span>{r.category}</span>}<span>Added {fmtDate(r.created_at)}</span></div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
