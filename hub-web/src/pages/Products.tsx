import { useMemo, useState } from 'react'
import { Seo } from '../components/Seo'
import { ProductCard } from '../components/Cards'
import { Empty, ErrorNote, SkeletonCards } from '../components/States'
import { listProducts } from '../lib/data'
import { useAsync } from '../lib/hooks'

export default function Products() {
  const { data, loading, error, reload } = useAsync(() => listProducts(), [])
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data ?? []).filter((p) => !term || `${p.title} ${p.description ?? ''} ${p.category ?? ''}`.toLowerCase().includes(term))
  }, [data, q])

  return (
    <>
      <Seo title="Digital products" description="Ebooks, prompt libraries, workbooks and templates for building an online business. Secure checkout through Selar." path="/products" />
      <header className="page-head">
        <div className="wrap">
          <p className="eyebrow">Grow</p>
          <h1>Digital products</h1>
          <p className="lede">Deeper material for when the free guides are not enough. Checkout is handled securely by Selar.</p>
        </div>
      </header>
      <section className="section">
        <div className="wrap">
          <div className="toolbar">
            <div className="field">
              <label htmlFor="pq" className="sr-only">Search products</label>
              <input id="pq" className="input" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          {loading && <SkeletonCards />}
          {error && <ErrorNote message={error} onRetry={reload} />}
          {data && data.length === 0 && <Empty title="No products are on sale yet">Products appear here the moment they are published, each with a verified Selar checkout.</Empty>}
          {data && data.length > 0 && shown.length === 0 && <Empty title="Nothing matches that search">Try a different word.</Empty>}
          {shown.length > 0 && <div className="grid grid--3">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
        </div>
      </section>
    </>
  )
}
