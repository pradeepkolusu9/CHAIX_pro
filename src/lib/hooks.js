import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Number display that is CORRECT ON FIRST PAINT.
 *
 * The previous version counted up from 0 on mount. In a product where the numbers
 * *are* the value proposition that is fatal: a slow machine, a throttled tab or a
 * plain screenshot all show `0` while the leaderboard further down says `1,850`,
 * so the page contradicts itself.
 *
 * The value now starts at its target and animates only when the target CHANGES —
 * i.e. on a reward, where the delta is the entire point.
 */
export function useCountUp(target, { duration = 700, enabled = true } = {}) {
  const targetNum = Number(target) || 0
  const [value, setValue] = useState(targetNum)
  const fromRef = useRef(targetNum)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      fromRef.current = targetNum
      setValue(targetNum)
      return undefined
    }
    const from = fromRef.current
    const delta = targetNum - from
    if (delta === 0) return undefined

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduce) {
      fromRef.current = targetNum
      setValue(targetNum)
      return undefined
    }

    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t) // easeOutExpo
      setValue(Math.round(from + delta * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = targetNum
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetNum, duration, enabled])

  return value
}

export const useReducedMotionPref = () => {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return undefined
    const on = () => setReduce(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

export const useMediaQuery = (query) => {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/** Ticking clock, used by the daily / 60-second challenge timers. */
export const useTicker = (active, interval = 1000) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [active, interval])
  return now
}

/** Fires once when the element scrolls into view. */
export function useInViewOnce(threshold = 0.25) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return undefined
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, seen])
  return [ref, seen]
}

/** Confetti burst — a self-contained canvas-free particle field. */
export function useBurst(duration = 2600) {
  const [parts, setParts] = useState([])
  const fire = useCallback(
    (count = 34) => {
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return
      const colors = ['#F5B942', '#4D7CFE', '#8B5CF6', '#22C55E', '#FFE7A8', '#FFFFFF']
      const next = Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
        const speed = 5 + Math.random() * 7
        return {
          id: `${Date.now()}-${i}`,
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 4,
          size: 5 + Math.random() * 7,
          color: colors[i % colors.length],
          rot: Math.random() * 360,
          delay: Math.random() * 0.25,
        }
      })
      setParts(next)
      setTimeout(() => setParts([]), duration)
    },
    [duration],
  )
  return { parts, fire }
}
