'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Anime un nombre de sa valeur précédente vers `target` (easeOutCubic).
 * Principe comportemental : le progrès visible (chiffre qui grimpe) déclenche
 * la dopamine de progression. Respecte prefers-reduced-motion (accessibilité).
 */
export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduced || target === fromRef.current) {
      fromRef.current = target
      setValue(target)
      return
    }

    const from = fromRef.current
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (target - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}
