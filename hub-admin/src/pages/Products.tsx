import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, ErrorBox, Loading, PageHead, StatusPill } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { supabase } from '../lib/supabase'

interface Row { id: string; title: string; slug: string; status: string; category: string | null; price: number | null; currency: string; selar_url: string | null }

export default function Products() {
  const { data, loading, error, reload } = useAsync(async () => {
    const { data, error } = await supabase.from('products').select('id,title,slug,status,category,price,currency,selar_url').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Row[]
  }, [])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const shown = useMemo(() => (data ?? []).filter((r) => (!status || r.status === status) && (!q || `${r.title} ${r.slug}`.toLowerCase().includes(q.toLowerCase()))), [data, q, status])

  return (
    <>
      <PageHead title="Products" sub="Digital products sold through Selar. Published products appear on the public site automatically." actions={<Link className="btn btn--primary" to="/products/new">New product</Link>} />
      <div className="filters">
        <input className="input" type="search" placeholder="Search products" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option><option value="draft">Draft</option><option value="active">Published</option><option value="archived">Archived</option>
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && data.length === 0 && <Empty title="No products yet">Add your first product, paste its Selar checkout link, then publish it.</Empty>}
      {data && data.length > 0 && shown.length === 0 && <Empty title="No products match your filters" />}
      {shown.length > 0 && (
        <div className="rows">
          {shown.map((r) => (
            <Link key={r.id} className="row" to={`/products/${r.id}`}>
              <strong>{r.title}</strong>
              <div className="row__meta">
                <StatusPill status={r.status} />
                {r.price !== null && <span>{r.currency} {r.price}</span>}
                {r.category && <span>{r.category}</span>}
                <span>{r.selar_url ? 'Checkout link set' : 'No checkout link'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
