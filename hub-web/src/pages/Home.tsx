import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { HeroScene } from '../components/HeroScene'
import { Counter } from '../components/Counter'
import { ArticleCard, ProductCard, ResourceRow } from '../components/Cards'
import { Empty, ErrorNote, SkeletonCards } from '../components/States'
import { NewsletterForm } from '../components/Forms'
import { CATEGORIES } from '../lib/categories'
import { getCounts, listArticles, listProducts, listResources } from '../lib/data'
import { useAsync } from '../lib/hooks'

export default function Home() {
  const articles = useAsync(() => listArticles(3), [])
  const resources = useAsync(() => listResources(3), [])
  const products = useAsync(() => listProducts(3), [])
  const counts = useAsync(getCounts, [])

  const c = counts.data
  const statItems = c
    ? [
        { v: c.articles, l: 'Published articles' },
        { v: c.resources, l: 'Free resources' },
        { v: c.products, l: 'Digital products' },
      ].filter((s) => s.v > 0)
    : []

  return (
    <>
      <Seo
        description="Practical guides, downloads and digital products on AI tools, affiliate marketing, content creation and online business. Honest education with no income promises."
        path="/"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Organization', name: 'Wealth Builders Hub', slogan: 'Learn. Build. Grow.', founder: { '@type': 'Person', name: 'Mustapha Abdurrazzaq' } }}
      />

      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <p className="eyebrow">Digital business education</p>
            <h1>
              The internet pays people who <span className="accent">understand it.</span> Start understanding it.
            </h1>
            <p className="lede">
              Wealth Builders Hub teaches the working parts of online business: AI tools, affiliate marketing, content, digital products and self-publishing. Clear guides, tools you can download, and nothing sold as a shortcut.
            </p>
            <div className="hero__cta">
              <Link className="btn btn--primary" to="/resources">Browse the library</Link>
              <Link className="btn btn--ghost" to="/affiliate">Join the affiliate programme</Link>
            </div>
            <p className="hero__note">Education only. We never promise income, and results depend on your effort and market.</p>
          </div>
          <HeroScene article={articles.data?.[0]} resource={resources.data?.[0]} product={products.data?.[0]} />
        </div>
      </section>

      {statItems.length > 0 && (
        <section aria-label="Library size" className="wrap">
          <div className="stats" style={{ gridTemplateColumns: `repeat(${Math.min(statItems.length, 2)}, minmax(0,1fr))` }}>
            {statItems.map((s) => <Counter key={s.l} value={s.v} label={s.l} />)}
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">What you can learn</p>
              <h2>Ten subjects, one practical path</h2>
            </div>
            <Link className="link-arrow" to="/articles">All articles</Link>
          </div>
          <ol className="cat-index">
            {CATEGORIES.map((cat, i) => (
              <li key={cat}>
                <Link to={`/articles?category=${encodeURIComponent(cat)}`}>
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  {cat}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">Learn</p>
              <h2>Latest articles</h2>
            </div>
            <Link className="link-arrow" to="/articles">Read all articles</Link>
          </div>
          {articles.loading && <SkeletonCards />}
          {articles.error && <ErrorNote message={articles.error} onRetry={articles.reload} />}
          {articles.data && articles.data.length === 0 && <Empty title="The first articles are being written">New guides are published here as soon as they are reviewed. Subscribe below and we will email you when they land.</Empty>}
          {articles.data && articles.data.length > 0 && <div className="grid grid--3">{articles.data.map((a) => <ArticleCard key={a.id} a={a} />)}</div>}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">Build</p>
              <h2>Free resources</h2>
            </div>
            <Link className="link-arrow" to="/resources">Open the library</Link>
          </div>
          {resources.loading && <SkeletonCards count={2} />}
          {resources.error && <ErrorNote message={resources.error} onRetry={resources.reload} />}
          {resources.data && resources.data.length === 0 && <Empty title="Downloads are being prepared">Checklists, templates and worksheets will appear here once they are approved for release.</Empty>}
          {resources.data && resources.data.length > 0 && <div>{resources.data.map((r) => <ResourceRow key={r.id} r={r} />)}</div>}
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">Grow</p>
              <h2>Digital products</h2>
            </div>
            <Link className="link-arrow" to="/products">See all products</Link>
          </div>
          {products.loading && <SkeletonCards />}
          {products.error && <ErrorNote message={products.error} onRetry={products.reload} />}
          {products.data && products.data.length === 0 && <Empty title="No products are on sale yet">Ebooks, prompt libraries and workbooks will be listed here with a secure Selar checkout when they are ready.</Empty>}
          {products.data && products.data.length > 0 && <div className="grid grid--3">{products.data.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
        </div>
      </section>

      <section className="section section--navy">
        <div className="wrap">
          <p className="eyebrow" style={{ color: '#FFB59A' }}>Why Wealth Builders Hub</p>
          <h2 style={{ maxWidth: '20ch' }}>Built for people who want the real picture</h2>
          <div className="principles" style={{ marginTop: 32 }}>
            <div className="principle">
              <h3>No income promises</h3>
              <p>You will not find earnings screenshots or guaranteed outcomes here. Online business rewards skill and consistency, and we teach both honestly.</p>
            </div>
            <div className="principle">
              <h3>Tools before theory</h3>
              <p>Every subject comes with something to use: a checklist, a template, a worksheet. Reading about work is not the same as doing it.</p>
            </div>
            <div className="principle">
              <h3>Written for two continents</h3>
              <p>Examples that work for readers in the United States, the United Kingdom and Canada, and in Nigeria and across Africa, including payment and platform realities on both sides.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="eyebrow">How it works</p>
          <h2 style={{ marginBottom: 36 }}>Learn, build, then grow</h2>
          <div className="steps">
            <div className="step">
              <span className="step__n">Step 1</span>
              <h3>Learn the fundamentals</h3>
              <p>Start with articles on the subject you care about. Each one explains the idea, the tools and the risks.</p>
            </div>
            <div className="step">
              <span className="step__n">Step 2</span>
              <h3>Build with the resources</h3>
              <p>Download the matching template or checklist and apply it to your own project while the lesson is fresh.</p>
            </div>
            <div className="step">
              <span className="step__n">Step 3</span>
              <h3>Grow with deeper material</h3>
              <p>When you need more depth, pick a digital product or apply to promote ours through the affiliate programme.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Affiliate programme</p>
            <h2>Recommend what you would use yourself</h2>
            <p className="lede">Approved affiliates promote Wealth Builders Hub products through their own Selar affiliate links. Applications are reviewed by hand, and approval is never automatic.</p>
            <ul className="checklist">
              <li>Honest promotion with clear disclosure</li>
              <li>Onboarding instructions after approval</li>
              <li>Links and tracking provided through Selar</li>
            </ul>
            <p style={{ marginTop: 28 }}><Link className="btn btn--primary" to="/affiliate">See how it works</Link></p>
          </div>
          <div className="notice notice--info">
            <strong>Before you apply:</strong> no one is guaranteed acceptance, sales or income. We look for people who will represent the products truthfully.
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Newsletter</p>
            <h2>New guides, straight to your inbox</h2>
            <p className="lede">One email when something worth reading is published. Unsubscribe whenever you like.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Questions about a product or download?</h2>
            <p className="muted" style={{ margin: 0 }}>Send a message and we will reply by email.</p>
          </div>
          <Link className="btn btn--ghost" to="/contact">Contact us</Link>
        </div>
      </section>
    </>
  )
}
