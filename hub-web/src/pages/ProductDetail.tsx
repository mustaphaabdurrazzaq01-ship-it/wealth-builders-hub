import { Link, useParams } from 'react-router-dom'
import { Seo, siteUrl } from '../components/Seo'
import { Cover } from '../components/Cards'
import { ErrorNote } from '../components/States'
import { getProduct } from '../lib/data'
import { coverUrl, formatPrice, validCheckout } from '../lib/format'
import { useAsync } from '../lib/hooks'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const { data: p, loading, error, reload } = useAsync(() => getProduct(slug), [slug])

  if (loading) return <div className="wrap section"><div className="skeleton" style={{ height: 360 }} /></div>
  if (error) return <div className="wrap section"><ErrorNote message={error} onRetry={reload} /></div>
  if (!p) return <NotFound />

  const price = formatPrice(p.price, p.currency)
  const img = coverUrl(p.cover_image_url)
  const desc = p.seo_description || p.description?.slice(0, 155) || `${p.title} from Wealth Builders Hub.`
  const canBuy = validCheckout(p.selar_url)

  return (
    <>
      <Seo
        title={p.seo_title || p.title}
        description={desc}
        path={`/products/${p.slug}`}
        image={img}
        type="product"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: desc, image: img ?? undefined, brand: { '@type': 'Brand', name: 'Wealth Builders Hub' }, ...(p.price !== null && canBuy ? { offers: { '@type': 'Offer', price: p.price, priceCurrency: p.currency, url: `${siteUrl()}/products/${p.slug}`, availability: 'https://schema.org/InStock' } } : {}) }}
      />
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <p className="crumbs"><Link to="/products">Digital products</Link></p>
          <div className="product">
            <Cover src={p.cover_image_url} alt={p.title} label={p.category ?? 'Digital product'} />
            <div className="product__buy">
              {p.category && <span className="tag" style={{ marginBottom: 14 }}>{p.category}</span>}
              <h1 style={{ fontSize: 'clamp(1.875rem, 1.3rem + 2.4vw, 2.75rem)' }}>{p.title}</h1>
              {price && <p className="price" style={{ fontSize: '1.5rem', marginBottom: 20 }}>{price}</p>}
              {p.description && <p className="lede" style={{ whiteSpace: 'pre-line' }}>{p.description}</p>}
              {p.features.length > 0 && (
                <>
                  <h2 style={{ fontSize: '1.125rem', marginTop: 24 }}>What is inside</h2>
                  <ul className="checklist" style={{ marginTop: 12 }}>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                </>
              )}
              {canBuy ? (
                <p style={{ marginTop: 28 }}>
                  <a className="btn btn--primary btn--block" href={p.selar_url!} target="_blank" rel="noopener noreferrer">Buy on Selar</a>
                </p>
              ) : (
                <div className="notice notice--info" style={{ marginTop: 24 }}>Checkout is not available for this product right now.</div>
              )}
              <p className="muted" style={{ fontSize: '0.875rem', marginTop: 14 }}>Opens Selar's secure checkout in a new tab. Digital product, delivered after payment. See the <Link to="/legal/disclaimer">educational disclaimer</Link>: no income is guaranteed.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
