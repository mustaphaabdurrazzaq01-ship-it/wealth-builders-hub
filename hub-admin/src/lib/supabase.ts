import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.')

// Publishable key only. Every privileged action is enforced by Row Level Security.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})
export const SUPABASE_URL = url
export const PUBLIC_SITE_URL = ((import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || '').replace(/\/$/, '')

export function publicFileUrl(bucket: string, value: string | null): string | null {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${value.replace(/^\/+/, '')}`
}

export function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-90)
}

export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined, upsert: false })
  if (error) throw new Error(error.message)
  return path
}

export function slugify(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return 'Something went wrong'
}
