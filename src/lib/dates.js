/** Date helpers — local-timezone safe, no external dependency. */

export const pad = (n) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' in local time. */
export function dayKeyList(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const todayKey = () => dayKeyList(new Date())

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** ms until the next local midnight — powers the "refreshes in HH:MM:SS" timer. */
export function msUntilMidnight() {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return next.getTime() - now.getTime()
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    h: pad(Math.floor(total / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
  }
}

export function formatRelative(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.round(hr / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')
