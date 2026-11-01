import { useEffect, useState } from 'react'
import { useInView } from '../lib/hooks'

export function Counter({ value, label }: { value: number; label: string }) {
  const { ref, seen } = useInView<HTMLDivElement>()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!seen) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || value <= 1) {
      setShown(value)
      return
    }
    const start = performance.now()
    const dur = 900
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, value])

  return (
    <div className="stat" ref={ref}>
      <div className="stat__num" aria-label={`${value} ${label}`}>
        {shown}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  )
}
