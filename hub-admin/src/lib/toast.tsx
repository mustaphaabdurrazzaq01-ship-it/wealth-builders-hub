import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface T { id: number; kind: 'ok' | 'err'; msg: string }
const Ctx = createContext<(kind: 'ok' | 'err', msg: string) => void>(() => {})
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const push = useCallback((kind: 'ok' | 'err', msg: string) => {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { id, kind, msg }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), kind === 'err' ? 7000 : 3500)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast toast--${t.kind}`}>{t.msg}</div>)}
      </div>
    </Ctx.Provider>
  )
}
