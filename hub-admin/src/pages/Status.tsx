import { ErrorBox, Loading, PageHead } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/hooks'
import { PUBLIC_SITE_URL, errMessage, supabase } from '../lib/supabase'

type State = 'connected' | 'not_connected' | 'config' | 'error'
interface Check { name: string; state: State; detail: string }

const PILL: Record<State, { cls: string; label: string }> = {
  connected: { cls: 'ok', label: 'Connected' },
  not_connected: { cls: 'neutral', label: 'Not connected' },
  config: { cls: 'warn', label: 'Configuration required' },
  error: { cls: 'err', label: 'Error' },
}

async function run(name: string, fn: () => Promise<string>): Promise<Check> {
  try {
    return { name, state: 'connected', detail: await fn() }
  } catch (e) {
    return { name, state: 'error', detail: errMessage(e) }
  }
}

export default function Status() {
  const { profile } = useAuth()
  const { data, loading, error, reload } = useAsync(async () => {
    const live = await Promise.all([
      run('Database', async () => {
        const { error } = await supabase.from('articles').select('id', { count: 'exact', head: true })
        if (error) throw new Error(error.message)
        return 'Supabase database answered.'
      }),
      run('Sign-in session', async () => {
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) throw new Error(error?.message ?? 'No valid session.')
        return `Session valid for the ${profile?.role} role.`
      }),
      run('Storage: hub-resources', async () => {
        const { error } = await supabase.storage.from('hub-resources').list('', { limit: 1 })
        if (error) throw new Error(error.message)
        return 'Bucket responded.'
      }),
      run('Storage: product-covers', async () => {
        const { error } = await supabase.storage.from('product-covers').list('', { limit: 1 })
        if (error) throw new Error(error.message)
        return 'Bucket responded.'
      }),
    ])
    let site: Check
    if (!PUBLIC_SITE_URL) site = { name: 'Public website', state: 'config', detail: 'VITE_PUBLIC_SITE_URL is not set for this app.' }
    else {
      try {
        await fetch(PUBLIC_SITE_URL, { mode: 'no-cors', cache: 'no-store' })
        site = { name: 'Public website', state: 'connected', detail: `${PUBLIC_SITE_URL} is reachable.` }
      } catch {
        site = { name: 'Public website', state: 'error', detail: `${PUBLIC_SITE_URL} could not be reached.` }
      }
    }
    const ads = await supabase.from('ad_placements').select('enabled,config')
    const adsOn = (ads.data ?? []).filter((a) => a.enabled && (a.config as { code?: string } | null)?.code?.trim()).length
    const adsStored = (ads.data ?? []).filter((a) => (a.config as { code?: string } | null)?.code?.trim()).length
    const integrations: Check[] = [
      { name: 'Adsterra advertising', state: adsOn ? 'config' : adsStored ? 'config' : 'not_connected', detail: adsOn || adsStored ? 'A publisher code is stored, but the public site does not display ads yet.' : 'No publisher code added. Advertising is off.' },
      { name: 'Google Analytics', state: 'not_connected', detail: 'No tracking is installed on the public site.' },
      { name: 'Google Search Console', state: 'not_connected', detail: 'Add and verify the final domain, then submit the sitemap.' },
      { name: 'Newsletter provider', state: 'not_connected', detail: 'Sign-ups are saved in the database only. Nothing is sent.' },
      { name: 'Email notifications', state: 'not_connected', detail: 'No email is sent for applications, messages or approvals.' },
      { name: 'WhatsApp and Telegram automation', state: 'not_connected', detail: 'Not built yet.' },
      { name: 'AI assistant', state: 'not_connected', detail: 'Not built yet.' },
    ]
    return { platform: [...live, site], integrations }
  }, [])

  const block = (title: string, rows: Check[]) => (
    <div className="card">
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <div className="rows">
        {rows.map((c) => (
          <div key={c.name} className="row">
            <div className="row__meta"><strong style={{ color: 'var(--navy)' }}>{c.name}</strong><span className={`pill pill--${PILL[c.state].cls}`}>{PILL[c.state].label}</span></div>
            <small style={{ overflowWrap: 'anywhere' }}>{c.detail}</small>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <PageHead title="System status" sub="Live checks run when you open this page. Anything not built is shown as not connected." actions={<button className="btn" onClick={reload}>Run checks again</button>} />
      {loading && <Loading />}
      {error && <ErrorBox message={error} retry={reload} />}
      {data && (
        <>
          {block('Platform', data.platform)}
          {block('Integrations', data.integrations)}
        </>
      )}
    </>
  )
}
