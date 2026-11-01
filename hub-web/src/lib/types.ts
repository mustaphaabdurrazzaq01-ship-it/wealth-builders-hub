export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  category: string | null
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  author_name: string
  reading_minutes: number | null
}

export interface Resource {
  id: string
  title: string
  description: string | null
  file_url: string | null
  cover_image_url: string | null
  resource_type: string | null
  category: string | null
  file_size_bytes: number | null
  created_at: string
}

export interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  price: number | null
  currency: string
  selar_url: string | null
  category: string | null
  features: string[]
  seo_title: string | null
  seo_description: string | null
  created_at: string
}
