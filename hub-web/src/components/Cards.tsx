import { Link } from 'react-router-dom'
import type { Article, Product, Resource } from '../lib/types'
import { coverUrl, fileExtension, formatBytes, formatDate, formatPrice, readingMinutes, resourceFileUrl, validCheckout } from '../lib/format'

export function Cover({ src, alt, label }: { src: string | null; alt: string; label: string }) {
  const url = coverUrl(src)
  if (url) {
    return (
      <div className="cover">
        <img src={url} alt={alt} loading="lazy" decoding="async" />
      </div>
    )
  }
  return (
    <div className="cover cover--fallback" aria-hidden="true">
      {label}
    </div>
  )
}

export function ArticleCard({ a, featured }: { a: Article; featured?: boolean }) {
  return (
    <Link to={`/articles/${a.slug}`} className={`card${featured ? ' feature' : ''}`}>
      <Cover src={a.cover_image_url} alt="" label={a.category ?? 'Article'} />
      <div className="card__body">
        {a.category && <span className="tag">{a.category}</span>}
        <h3 className="card__title">{a.title}</h3>
        {a.excerpt && <p className="card__text">{a.excerpt}</p>}
        <div className="card__meta">
          <span>{formatDate(a.published_at)}</span>
          {a.reading_minutes ? <span>· {a.reading_minutes} min read</span> : null}
        </div>
      </div>
    </Link>
  )
}

export function ResourceRow({ r }: { r: Resource }) {
  const href = resourceFileUrl(r.file_url)
  const ext = fileExtension(r.file_url)
  const size = formatBytes(r.file_size_bytes)
  return (
    <article className="resource">
      <Cover src={r.cover_image_url} alt="" label={r.resource_type ?? 'Resource'} />
      <div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {r.resource_type && <span className="tag">{r.resource_type}</span>}
          {r.category && <span className="tag">{r.category}</span>}
        </div>
        <h3>{r.title}</h3>
        {r.description && <p>{r.description}</p>}
        <p style={{ marginTop: 6, fontSize: '0.8125rem' }}>{[ext, size].filter(Boolean).join(' · ')}</p>
      </div>
      {href && (
        <a className="btn btn--primary" href={href} target="_blank" rel="noopener noreferrer" download>
          Download
        </a>
      )}
    </article>
  )
}

export function ProductCard({ p }: { p: Product }) {
  const price = formatPrice(p.price, p.currency)
  return (
    <Link to={`/products/${p.slug}`} className="card">
      <Cover src={p.cover_image_url} alt="" label={p.category ?? 'Digital product'} />
      <div className="card__body">
        {p.category && <span className="tag">{p.category}</span>}
        <h3 className="card__title">{p.title}</h3>
        {p.description && <p className="card__text">{p.description.length > 140 ? `${p.description.slice(0, 137)}…` : p.description}</p>}
        <div className="card__meta" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {price ? <span className="price">{price}</span> : <span />}
          {validCheckout(p.selar_url) && <span className="link-arrow">View</span>}
        </div>
      </div>
    </Link>
  )
}

export { readingMinutes }
