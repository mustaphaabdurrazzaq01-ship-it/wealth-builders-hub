import { SUPABASE_URL } from './supabase'

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatPrice(price: number | null, currency: string): string | null {
  if (price === null || price === undefined) return null
  if (price === 0) return 'Free'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: price % 1 ? 2 : 0 }).format(price)
  } catch {
    return `${currency} ${price}`
  }
}

export function readingMinutes(content: string, stored: number | null): number {
  if (stored && stored > 0) return stored
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function formatBytes(bytes: number | null): string | null {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Stored values may be a full URL or a path inside a public bucket. */
export function storageUrl(bucket: string, value: string | null): string | null {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${value.replace(/^\/+/, '')}`
}

export const coverUrl = (v: string | null) => storageUrl('product-covers', v)
export const resourceFileUrl = (v: string | null) => storageUrl('hub-resources', v)

export function fileExtension(path: string | null): string | null {
  if (!path) return null
  const clean = path.split('?')[0]
  const ext = clean.includes('.') ? clean.split('.').pop() : null
  return ext ? ext.toUpperCase() : null
}

/** Only https links are allowed to open as checkout. */
export function validCheckout(url: string | null): url is string {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

export function slugify(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}
