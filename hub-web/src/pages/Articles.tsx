import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { ArticleCard } from '../components/Cards'
import { Empty, ErrorNote, SkeletonCards } from '../components/States'
import { listArticles } from '../lib/data'
import { useAsync } from '../lib/hooks'

export default function Articles() {
  const { data, loading, error, reload } = useAsync(() => listArticles(), [])
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const category = params.get('category') ?? ''

  const categories = useMemo(() => Array.from(new Set((data ?? []).map((a) => a.category).filter(Boolean) as string[])).sort(), [data])
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data ?? []).filter((a) => (!category || a.category === category) && (!term || `${a.title} ${a.excerpt ?? ''}`.toLowerCase().includes(term)))
  }, [data, q, category])

  const setCategory = (c: string) => setParams(c ? { category: c } : {})
  const showFeature = !q && !category && shown.length > 2
  const [first, ...rest] = shown

  return (
    <>
      <Seo title="Articles" description="Guides on AI tools, affiliate marketing, content creation, digital products and online business, written to be practical and honest." path="/articles" />
      <header className="page-head">
        <div className="wrap">
          <p className="eyebrow">Learn</p>
          <h1>Articles</h1>
          <p className="lede">Guides you can act on. Search, or filter by subject.</p>
        </div>
      </header>
      <section className="section">
        <div className="wrap">
          <div className="toolbar">
            <div className="field">
              <label htmlFor="q" className="sr-only">Search articles</label>
              <input id="q" className="input" type="search" placeholder="Search articles" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {categories.length > 0 && (
              <div className="chips" role="group" aria-label="Filter by category">
                <button className="chip" aria-pressed={!category} onClick={() => setCategory('')}>All</button>
                {categories.map((c) => <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}
              </div>
            )}
          </div>
          {loading && <SkeletonCards />}
          {error && <ErrorNote message={error} onRetry={reload} />}
          {data && data.length === 0 && <Empty title="No articles published yet">The first guides are in review. Check back soon, or subscribe on the home page.</Empty>}
          {data && data.length > 0 && shown.length === 0 && <Empty title="Nothing matches that search">Try a different word or clear the category filter.</Empty>}
          {showFeature && first && <ArticleCard a={first} featured />}
          {shown.length > 0 && <div className="grid grid--3">{(showFeature ? rest : shown).map((a) => <ArticleCard key={a.id} a={a} />)}</div>}
        </div>
      </section>
    </>
  )
}
