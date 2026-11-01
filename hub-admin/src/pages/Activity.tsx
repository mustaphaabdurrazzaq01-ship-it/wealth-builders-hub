import { useState } from 'react'
import { Empty, ErrorBox, Loading, PageHead } from '../components/ui'
import { fmtDate, useAsync } from '../lib/hooks'
import { supabase } from '../lib/supabase'

interface Log { id: string; actor: string | null; action: string; entity: string | null; entity_id: string | null; details: Record<string, unknown> | null; created_at: string }
const PAGE = 50

export default function Activity() {
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useAsync(async () => {
    let query = supabase.from('activity_logs').select('id,actor,action,entity,entity_id,details,created_at', { count: 'exact' }).order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1)
    if (q.trim()) query = query.ilike('action', `%${q.trim().replace(/[%_]/g, '')}%`)
    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return { rows: (data ?? []) as Log[], total: count ?? 0 }
  }, [page, q])

  return (
    <>
      <PageHead title="Activity logs" sub="Sign-ins and changes made in the Admin Studio. Passwords and tokens are never recorded." />
      <div className="filters">
        <input className="input" type="search" placeholder="Filter by action, for example product" aria-label="Filter by action" value={q} onChange={(e) => { setPage(0); setQ(e.target.value) }} />
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && data.rows.length === 0 && <Empty title="No activity recorded">Actions such as sign-ins, publishing and approvals are logged here.</Empty>}
      {data && data.rows.length > 0 && (
        <>
          <div className="rows">
            {data.rows.map((l) => (
              <div key={l.id} className="row">
                <strong style={{ overflowWrap: 'anywhere' }}>{l.action}</strong>
                <div className="row__meta">
                  <span>{fmtDate(l.created_at)}</span>
                  {l.entity && <span>{l.entity}{l.entity_id ? ` ${l.entity_id.slice(0, 8)}` : ''}</span>}
                  {l.details && <span style={{ overflowWrap: 'anywhere' }}>{JSON.stringify(l.details)}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="tabs" style={{ marginTop: 16, alignItems: 'center' }}>
            <button className="btn btn--sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Newer</button>
            <span className="muted">Showing {page * PAGE + 1} to {page * PAGE + data.rows.length} of {data.total}</span>
            <button className="btn btn--sm" disabled={(page + 1) * PAGE >= data.total} onClick={() => setPage((p) => p + 1)}>Older</button>
          </div>
        </>
      )}
    </>
  )
}
