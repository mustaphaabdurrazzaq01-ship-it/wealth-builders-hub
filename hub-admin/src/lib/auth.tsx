import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Role = 'admin' | 'editor'
export interface Profile { id: string; display_name: string | null; role: Role }

interface AuthCtx {
  session: Session | null
  profile: Profile | null
  loading: boolean
  notice: string | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)
export const useAuth = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside AuthProvider')
  return c
}

export async function logAction(action: string, entity?: string, entityId?: string, details?: Record<string, unknown>) {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return
  // Never log passwords, tokens or other credentials: callers pass only field names and ids.
  await supabase.from('activity_logs').insert({ actor: data.user.id, action, entity: entity ?? null, entity_id: entityId ?? null, details: details ?? null })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const manualSignOut = useRef(false)

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('id,display_name,role').eq('id', s.user.id).maybeSingle()
    if (error || !data || (data.role !== 'admin' && data.role !== 'editor')) {
      setNotice('This account does not have access to the Admin Studio.')
      manualSignOut.current = true
      await supabase.auth.signOut()
      setProfile(null)
      return
    }
    setProfile(data as Profile)
  }, [])

  useEffect(() => {
    let live = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!live) return
      setSession(data.session)
      await loadProfile(data.session)
      if (live) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        if (!manualSignOut.current) setNotice('Your session expired. Sign in again to continue.')
        manualSignOut.current = false
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Defer: calling Supabase inside this callback can deadlock.
        setTimeout(() => void loadProfile(s), 0)
      }
    })
    return () => {
      live = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setNotice(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return 'Email or password is incorrect.'
    void logAction('auth.login')
    return null
  }, [])

  const signOut = useCallback(async () => {
    manualSignOut.current = true
    setNotice(null)
    await supabase.auth.signOut()
  }, [])

  return <Ctx.Provider value={{ session, profile, loading, notice, isAdmin: profile?.role === 'admin', signIn, signOut }}>{children}</Ctx.Provider>
}
