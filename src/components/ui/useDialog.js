import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Open dialogs, top last. Only the top one handles keys, so a confirm opened from a drawer wins. */
const stack = []

/**
 * Shared dialog behaviour: initial focus into the panel, Escape to close, Tab
 * trap, focus restore to the opener. Attach the returned ref to the panel
 * (give it tabIndex={-1} so it can take focus when it holds nothing focusable).
 */
export function useDialog({ open, onClose, dismissible = true }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  const dismissRef = useRef(dismissible)
  useEffect(() => {
    closeRef.current = onClose
    dismissRef.current = dismissible
  })

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const token = {}
    stack.push(token)
    const items = () => [...(ref.current?.querySelectorAll(FOCUSABLE) ?? [])].filter((n) => n.getClientRects().length)
    ;(ref.current?.querySelector('[data-autofocus]') || items()[0] || ref.current)?.focus({ preventScroll: true })

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return
      if (e.key === 'Escape' && dismissRef.current) {
        e.preventDefault()
        closeRef.current?.()
      } else if (e.key === 'Tab' && ref.current) {
        const list = items()
        if (!list.length) return e.preventDefault()
        const first = list[0]
        const last = list[list.length - 1]
        const inside = ref.current.contains(document.activeElement)
        if (e.shiftKey && (document.activeElement === first || !inside)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      stack.splice(stack.indexOf(token), 1)
      if (opener?.isConnected) opener.focus?.({ preventScroll: true })
    }
  }, [open])

  return ref
}
