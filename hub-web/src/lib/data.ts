import { supabase } from './supabase'
import type { Article, Product, Resource } from './types'

const ARTICLE_LIST =
  'id,title,slug,excerpt,cover_image_url,category,published_at,created_at,updated_at,author_name,reading_minutes,seo_title,seo_description'
const RESOURCE_COLS = 'id,title,description,file_url,cover_image_url,resource_type,category,file_size_bytes,created_at'
const PRODUCT_COLS =
  'id,title,slug,description,cover_image_url,price,currency,selar_url,category,features,seo_title,seo_description,created_at'

function fail(error: { message: string } | null): never | void {
  if (error) throw new Error(error.message)
}

export async function listArticles(limit?: number): Promise<Article[]> {
  let q = supabase.from('articles').select(ARTICLE_LIST).eq('status', 'published').order('published_at', { ascending: false, nullsFirst: false })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  fail(error)
  return ((data ?? []) as unknown as Article[]).map((a) => ({ ...a, content: '' }))
}

export async function getArticle(slug: string): Promise<Article | null> {
  const { data, error } = await supabase.from('articles').select(`${ARTICLE_LIST},content`).eq('slug', slug).eq('status', 'published').maybeSingle()
  fail(error)
  return (data as unknown as Article) ?? null
}

export async function listResources(limit?: number): Promise<Resource[]> {
  let q = supabase.from('resources').select(RESOURCE_COLS).eq('status', 'published').not('file_url', 'is', null).order('created_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  fail(error)
  return (data ?? []) as Resource[]
}

export async function listProducts(limit?: number): Promise<Product[]> {
  let q = supabase.from('products').select(PRODUCT_COLS).eq('status', 'active').order('created_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  fail(error)
  return ((data ?? []) as Product[]).map((p) => ({ ...p, features: p.features ?? [] }))
}

export async function getProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(PRODUCT_COLS).eq('slug', slug).eq('status', 'active').maybeSingle()
  fail(error)
  return data ? { ...(data as Product), features: (data as Product).features ?? [] } : null
}

export interface Counts {
  articles: number
  resources: number
  products: number
}

export async function getCounts(): Promise<Counts> {
  const head = { count: 'exact' as const, head: true }
  const [a, r, p] = await Promise.all([
    supabase.from('articles').select('id', head).eq('status', 'published'),
    supabase.from('resources').select('id', head).eq('status', 'published'),
    supabase.from('products').select('id', head).eq('status', 'active'),
  ])
  fail(a.error)
  fail(r.error)
  fail(p.error)
  return { articles: a.count ?? 0, resources: r.count ?? 0, products: p.count ?? 0 }
}
