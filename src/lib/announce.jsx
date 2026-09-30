/**
 * Screen-reader announcements.
 *
 * The app had ZERO `aria-live` regions, so the XP-earned popup, every toast, the
 * level-up, the badge unlock, the AI's answer, the scenario reveal — and even a
 * render crash — were completely silent to assistive tech. Every one of those is
 * a change of state the user cannot see, which is exactly what a live region is for.
 *
 * One polite announcer and one assertive (for failures) is enough. They live here
 * rather than in each component so the priority and politeness settings are
 * decided in exactly one place.
 */
import { createContext, useContext, useCallback, useMemo, useRef, useState, useEffect } from 'react'

const AnnouncerContext = createContext(null)

export function AnnouncerProvider({ children }) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')
  const timers = useRef({ polite: null, assertive: null })

  useEffect(
    () => () => {
      clearTimeout(timers.current.polite)
      clearTimeout(timers.current.assertive)
    },
    [],
  )

  const say = useCallback((message, priority = 'polite') => {
    if (!message) return
    const set = priority === 'assertive' ? setAssertive : setPolite
    clearTimeout(timers.current[priority])
    // Clear first so an identical consecutive message still re-announces.
    set('')
    timers.current[priority] = setTimeout(() => set(message), 60)
  }, [])

  const value = useMemo(() => ({ say, announce: say }), [say])

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      {/* The regions themselves are visually hidden but live in the a11y tree. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div aria-live="assertive" aria-atomic="true" role="alert" className="sr-only">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  )
}

export function useAnnounce() {
  const ctx = useContext(AnnouncerContext)
  // Consumers must not crash if rendered outside the provider.
  return ctx?.say ?? (() => {})
}
