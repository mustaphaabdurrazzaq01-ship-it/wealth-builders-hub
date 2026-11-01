import { useMemo, useState } from 'react'
import { Seo } from '../components/Seo'
import { ResourceRow } from '../components/Cards'
import { Empty, ErrorNote, SkeletonCards } from '../components/States'
import { listResources } from '../lib/data'
import { useAsync } from '../lib/hooks'

export default function Resources() {
  const { data, loading, error, reload } = useAsync(() => listResources(), [])
  const [q, setQ] = useState('')
  const [type, setType] = useState('')

  const types = useMemo(() => Array.from(new Set((data ?? []).map((r) => r.resource_type).filter(Boolean) as string[])).sort(), [data])
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data ?? []).filter((r) => (!type || r.resource_type === type) && (!term || `${r.title} ${r.description ?? ''} ${r.category ?? ''}`.toLowerCase().includes(term)))
  }, [data, q, type])

  return (
    <>
      <Seo title="Resources" description="Free downloadable guides, checklists, templates and worksheets for digital business, affiliate marketing, AI tools and content creation." path="/resources" />
      <header className="page-head">
        <div className="wrap">
          <p className="eyebrow">Build</p>
          <h1>Resource library</h1>
          <p className="lede">Downloads you can use today. Every file here has been reviewed before release.</p>
        </div>
      </header>
      <section className="section">
        <div className="wrap">
          <div className="toolbar">
            <div className="field">
              <label htmlFor="rq" className="sr-only">Search resources</label>
              <input id="rq" className="input" type="search" placeholder="Search resources" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {types.length > 0 && (
              <div className="chips" role="group" aria-label="Filter by type">
                <button className="chip" aria-pressed={!type} onClick={() => setType('')}>All</button>
                {types.map((t) => <button key={t} className="chip" aria-pressed={type === t} onClick={() => setType(t)}>{t}</button>)}
              </div>
            )}
          </div>
          {loading && <SkeletonCards count={2} />}
          {error && <ErrorNote message={error} onRetry={reload} />}
          {data && data.length === 0 && <Empty title="No downloads are published yet">Guides, checklists and templates will appear here once they are approved for release.</Empty>}
          {data && data.length > 0 && shown.length === 0 && <Empty title="Nothing matches that search">Try another word or clear the type filter.</Empty>}
          {shown.map((r) => <ResourceRow key={r.id} r={r} />)}
        </div>
      </section>
    </>
  )
}
