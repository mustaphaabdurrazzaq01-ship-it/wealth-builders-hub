# Wealth Builders Hub

Two separate apps on one Supabase project.

- `hub-web`: public website (Vite, React, TypeScript). Vercel root directory: `hub-web`
- `hub-admin`: private Admin Studio (Vite, React, TypeScript). Vercel root directory: `hub-admin`

Environment variables (set in Vercel, never committed):

| App | Variable |
|---|---|
| both | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| hub-web | `VITE_SITE_URL` (public site address, used for the sitemap) |
| hub-admin | `VITE_PUBLIC_SITE_URL` (public site address) |

Only the publishable key is used in the browser. All permissions are enforced by Row Level Security in Supabase.
