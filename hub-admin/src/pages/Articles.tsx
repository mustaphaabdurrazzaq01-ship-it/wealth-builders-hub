import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, ErrorBox, Loading, PageHead, StatusPill } from '../components/ui'
import { fmtDate, useAsync } from '../lib/hooks'
import { supabase } from '../lib/supabase'

interface Row { id: string; title: string; slug: string; status: string; category: string | null; updated_at: string }

export default function Articles() {
  const { data, loading, error, reload } = useAsync(async () => {
    const { data, error } = await supabase.from('articles').select('id,title,slug,status,category,updated_at').order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Row[]
  }, [])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const shown = useMemo(() => (data ?? []).filter((r) => (!status || r.status === status) && (!q || `${r.title} ${r.slug}`.toLowerCase().includes(q.toLowerCase()))), [data, q, status])

  return (
    <>
      <PageHead title="Articles" sub="Write, review and publish guides." actions={<Link className="btn btn--primary" to="/articles/new">New article</Link>} />
      <div className="filters">
        <input className="input" type="search" placeholder="Search by title or slug" aria-label="Search articles" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && data.length === 0 && <Empty title="No articles yet">Create the first one with the New article button.</Empty>}
      {data && data.length > 0 && shown.length === 0 && <Empty title="No articles match your filters" />}
      {shown.length > 0 && (
        <div className="rows">
          {shown.map((r) => (
            <Link key={r.id} className="row" to={`/articles/${r.id}`}>
              <strong>{r.title}</strong>
              <div className="row__meta"><StatusPill status={r.status} /><span>{r.category ?? 'Uncategorised'}</span><span>/{r.slug}</span><span>Updated {fmtDate(r.updated_at)}</span></div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
