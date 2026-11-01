// Generates dist/sitemap.xml from published rows (anonymous, RLS-protected read).
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const site = (process.env.VITE_SITE_URL || '').replace(/\/$/, '')

if (!site) {
  console.warn('sitemap: VITE_SITE_URL is not set, skipping sitemap.xml')
  process.exit(0)
}

async function rows(table, filter) {
  const r = await fetch(`${url}/rest/v1/${table}?select=slug,updated_at&${filter}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!r.ok) throw new Error(`${table}: ${r.status}`)
  return r.json()
}

const [articles, products] = await Promise.all([rows('articles', 'status=eq.published'), rows('products', 'status=eq.active')])
const fixed = ['', '/about', '/articles', '/resources', '/products', '/affiliate', '/contact']
const entries = [
  ...fixed.map((p) => ({ loc: `${site}${p}` })),
  ...articles.map((a) => ({ loc: `${site}/articles/${a.slug}`, lastmod: a.updated_at })),
  ...products.map((p) => ({ loc: `${site}/products/${p.slug}`, lastmod: p.updated_at })),
]
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
  .map((e) => `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`)
  .join('\n')}\n</urlset>\n`
if (!existsSync('dist')) mkdirSync('dist')
writeFileSync('dist/sitemap.xml', xml)
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`)
console.log(`sitemap: wrote ${entries.length} URLs`)
