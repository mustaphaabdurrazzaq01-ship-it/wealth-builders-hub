import { Link } from 'react-router-dom'
import { ErrorBox, Loading, PageHead } from '../components/ui'
import { useAuth } from '../lib/auth'
import { fmtDate, useAsync } from '../lib/hooks'
import { supabase } from '../lib/supabase'

interface Log { id: string; action: string; entity: string | null; created_at: string }

async function count(table: string, col?: string, val?: string): Promise<number> {
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  if (col && val) q = q.eq(col, val)
  const { count: n, error } = await q
  if (error) throw new Error(`${table}: ${error.message}`)
  return n ?? 0
}

export default function Overview() {
  const { isAdmin, profile } = useAuth()
  const { data, loading, error, reload } = useAsync(async () => {
    const [aT, aP, aD, rT, rP, pT, pP, appNew, appOk, msgNew] = await Promise.all([
      count('articles'), count('articles', 'status', 'published'), count('articles', 'status', 'draft'),
      count('resources'), count('resources', 'status', 'published'),
      isAdmin ? count('products') : 0, isAdmin ? count('products', 'status', 'active') : 0,
      isAdmin ? count('affiliate_applications', 'status', 'pending') : 0,
      isAdmin ? count('affiliate_applications', 'status', 'approved') : 0,
      isAdmin ? count('contact_messages', 'status', 'new') : 0,
    ])
    let logs: Log[] = []
    if (isAdmin) {
      const r = await supabase.from('activity_logs').select('id,action,entity,created_at').order('created_at', { ascending: false }).limit(8)
      if (r.error) throw new Error(r.error.message)
      logs = (r.data ?? []) as Log[]
    }
    return { aT, aP, aD, rT, rP, pT, pP, appNew, appOk, msgNew, logs }
  }, [isAdmin])

  return (
    <>
      <PageHead title="Overview" sub={`Signed in as ${profile?.display_name || profile?.role}. All figures come straight from the database.`} />
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && (
        <>
          <div className="grid-stats">
            <Link className="stat" to="/articles"><b>{data.aT}</b><span>Articles in total</span></Link>
            <Link className="stat" to="/articles"><b>{data.aP}</b><span>Published articles</span></Link>
            <Link className="stat" to="/articles"><b>{data.aD}</b><span>Draft articles</span></Link>
            <Link className="stat" to="/resources"><b>{data.rT}</b><span>Resources ({data.rP} published)</span></Link>
            {isAdmin && (
              <>
                <Link className="stat" to="/products"><b>{data.pT}</b><span>Products ({data.pP} published)</span></Link>
                <Link className="stat" to="/applications"><b>{data.appNew}</b><span>New affiliate applications</span></Link>
                <Link className="stat" to="/applications"><b>{data.appOk}</b><span>Approved affiliates</span></Link>
                <Link className="stat" to="/messages"><b>{data.msgNew}</b><span>Unread messages</span></Link>
              </>
            )}
          </div>
          {isAdmin && (
            <div className="card">
              <h2 style={{ marginBottom: 12 }}>Recent activity</h2>
              {data.logs.length === 0 ? <p className="muted" style={{ margin: 0 }}>No activity recorded yet.</p> : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.logs.map((l) => <div key={l.id} className="row__meta"><strong style={{ color: 'var(--navy)' }}>{l.action}</strong>{l.entity && <span>{l.entity}</span>}<span>{fmtDate(l.created_at)}</span></div>)}
                </div>
              )}
              <p style={{ margin: '14px 0 0' }}><Link to="/activity">All activity</Link> · <Link to="/status">System status</Link></p>
            </div>
          )}
        </>
      )}
    </>
  )
}
