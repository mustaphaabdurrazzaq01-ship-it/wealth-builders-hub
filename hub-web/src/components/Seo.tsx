import { useEffect } from 'react'

const SITE_NAME = 'Wealth Builders Hub'
const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || '').replace(/\/$/, '')

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

interface SeoProps {
  title?: string
  description: string
  path: string
  image?: string | null
  type?: 'website' | 'article' | 'product'
  jsonLd?: Record<string, unknown>
  noindex?: boolean
}

export function Seo({ title, description, path, image, type = 'website', jsonLd, noindex }: SeoProps) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Learn. Build. Grow.`
    const base = SITE_URL || window.location.origin
    const url = `${base}${path}`
    document.title = full
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')
    setMeta('property', 'og:title', full)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type === 'product' ? 'website' : type)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', full)
    setMeta('name', 'twitter:description', description)
    if (image) {
      setMeta('property', 'og:image', image)
      setMeta('name', 'twitter:image', image)
    }

    let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canon) {
      canon = document.createElement('link')
      canon.rel = 'canonical'
      document.head.appendChild(canon)
    }
    canon.href = url

    const id = 'ld-json'
    document.getElementById(id)?.remove()
    if (jsonLd) {
      const s = document.createElement('script')
      s.id = id
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(s)
    }
    return () => document.getElementById(id)?.remove()
  }, [title, description, path, image, type, jsonLd, noindex])
  return null
}

export const siteUrl = () => SITE_URL || window.location.origin
