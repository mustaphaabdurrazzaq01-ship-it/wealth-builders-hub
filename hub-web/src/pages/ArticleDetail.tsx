import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo, siteUrl } from '../components/Seo'
import { ArticleCard } from '../components/Cards'
import { ErrorNote } from '../components/States'
import { getArticle, listArticles } from '../lib/data'
import { coverUrl, formatDate, readingMinutes } from '../lib/format'
import { useAsync } from '../lib/hooks'
import { Markdown } from '../lib/markdown'
import NotFound from './NotFound'

export default function ArticleDetail() {
  const { slug = '' } = useParams()
  const { data: a, loading, error, reload } = useAsync(() => getArticle(slug), [slug])
  const related = useAsync(() => listArticles(12), [slug])
  const [copied, setCopied] = useState(false)

  if (loading) return <div className="wrap section"><div className="skeleton" style={{ height: 40, width: '60%' }} /><div className="skeleton" style={{ height: 300, marginTop: 24 }} /></div>
  if (error) return <div className="wrap section"><ErrorNote message={error} onRetry={reload} /></div>
  if (!a) return <NotFound />

  const url = `${siteUrl()}/articles/${a.slug}`
  const img = coverUrl(a.cover_image_url)
  const desc = a.seo_description || a.excerpt || a.content.slice(0, 155)
  const minutes = readingMinutes(a.content, a.reading_minutes)
  const rel = (related.data ?? []).filter((r) => r.id !== a.id && r.category === a.category).slice(0, 3)
  const enc = encodeURIComponent

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  return (
    <>
      <Seo
        title={a.seo_title || a.title}
        description={desc}
        path={`/articles/${a.slug}`}
        image={img}
        type="article"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: desc, image: img ?? undefined, datePublished: a.published_at ?? a.created_at, dateModified: a.updated_at, author: { '@type': 'Person', name: a.author_name }, publisher: { '@type': 'Organization', name: 'Wealth Builders Hub' }, mainEntityOfPage: url }}
      />
      <article className="section" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="article">
            <p className="crumbs"><Link to="/articles">Articles</Link>{a.category ? <> / <Link to={`/articles?category=${encodeURIComponent(a.category)}`}>{a.category}</Link></> : null}</p>
            <h1 style={{ fontSize: 'clamp(2rem, 1.3rem + 3vw, 3rem)' }}>{a.title}</h1>
            {a.excerpt && <p className="lede">{a.excerpt}</p>}
            <div className="article__meta">
              <span>By {a.author_name}</span>
              <span>{formatDate(a.published_at)}</span>
              <span>{minutes} min read</span>
            </div>
            {img && <div className="article__cover"><img src={img} alt="" decoding="async" /></div>}
            <Markdown source={a.content} />
            <div className="share" aria-label="Share this article">
              <strong style={{ marginRight: 4 }}>Share</strong>
              <a className="btn btn--ghost" href={`https://wa.me/?text=${enc(`${a.title} ${url}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a className="btn btn--ghost" href={`https://twitter.com/intent/tweet?text=${enc(a.title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">X</a>
              <a className="btn btn--ghost" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a className="btn btn--ghost" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
              <button className="btn btn--ghost" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
            </div>
          </div>
        </div>
      </article>
      {rel.length > 0 && (
        <section className="section section--cream">
          <div className="wrap">
            <h2 style={{ marginBottom: 28 }}>Related articles</h2>
            <div className="grid grid--3">{rel.map((r) => <ArticleCard key={r.id} a={r} />)}</div>
          </div>
        </section>
      )}
    </>
  )
}
