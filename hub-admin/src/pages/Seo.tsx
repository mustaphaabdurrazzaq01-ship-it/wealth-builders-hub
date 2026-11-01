import { Link } from 'react-router-dom'
import { Empty, ErrorBox, Loading, PageHead } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { PUBLIC_SITE_URL, supabase } from '../lib/supabase'

interface Item { id: string; title: string; slug: string; seo_title: string | null; seo_description: string | null; kind: 'article' | 'product' }

export default function Seo() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [a, p] = await Promise.all([
      supabase.from('articles').select('id,title,slug,seo_title,seo_description').eq('status', 'published'),
      supabase.from('products').select('id,title,slug,seo_title,seo_description').eq('status', 'active'),
    ])
    if (a.error) throw new Error(a.error.message)
    if (p.error) throw new Error(p.error.message)
    return [
      ...(a.data ?? []).map((r) => ({ ...r, kind: 'article' as const })),
      ...(p.data ?? []).map((r) => ({ ...r, kind: 'product' as const })),
    ] as Item[]
  }, [])
  const gaps = (data ?? []).map((i) => ({ i, missing: [!i.seo_title?.trim() && 'SEO title', !i.seo_description?.trim() && 'meta description'].filter(Boolean) as string[] })).filter((g) => g.missing.length)

  return (
    <>
      <PageHead title="SEO and discovery" sub="Check that published pages have search metadata, and find the files search engines read." />
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Search engine files</h2>
        {PUBLIC_SITE_URL ? (
          <p style={{ margin: 0 }}>
            <a href={`${PUBLIC_SITE_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer">sitemap.xml</a> · <a href={`${PUBLIC_SITE_URL}/robots.txt`} target="_blank" rel="noopener noreferrer">robots.txt</a>
          </p>
        ) : <p className="muted" style={{ margin: 0 }}>The public site address is not configured for this app, so links cannot be shown.</p>}
        <p className="hint">The sitemap is generated when the public site is built and deployed. Newly published articles and products appear in it after the next deployment of the public site.</p>
        <p className="hint" style={{ marginBottom: 0 }}>The Admin Studio is marked noindex and blocked in its robots.txt, so it will not appear in search results.</p>
      </div>
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Published pages missing metadata</h2>
        {loading && <Loading rows={2} />}
        {error && <ErrorBox message={error} retry={reload} />}
        {data && data.length === 0 && <Empty title="Nothing published yet">Publish an article or product and its search metadata will be checked here.</Empty>}
        {data && data.length > 0 && gaps.length === 0 && <p style={{ margin: 0 }}>All {data.length} published pages have an SEO title and meta description.</p>}
        {gaps.length > 0 && (
          <div className="rows">
            {gaps.map(({ i, missing }) => (
              <Link key={`${i.kind}-${i.id}`} className="row" to={`/${i.kind === 'article' ? 'articles' : 'products'}/${i.id}`}>
                <strong>{i.title}</strong>
                <div className="row__meta"><span>{i.kind === 'article' ? 'Article' : 'Product'}</span><span>Missing {missing.join(' and ')}</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Google Search Console</h2>
        <p style={{ margin: 0 }}>Not connected. After the public site has its final domain, add it in Search Console, verify it, and submit the sitemap address above.</p>
      </div>
    </>
  )
}
