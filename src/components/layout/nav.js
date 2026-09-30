import {
  Home,
  Map,
  Zap,
  BookOpen,
  Trophy,
  Award,
  Bot,
  Siren,
  Timer,
  Shield,
} from 'lucide-react'

/** Single source of truth for navigation. Sidebar, mobile nav and search all read this. */
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true, group: 'Learn' },
  { to: '/journey', label: 'Legal Journey', short: 'Journey', icon: Map, group: 'Learn' },
  { to: '/learn', label: 'Learn', icon: BookOpen, group: 'Learn' },
  { to: '/daily', label: 'Daily Challenge', icon: Zap, group: 'Play' },
  { to: '/speed', label: '60-Second Run', icon: Timer, group: 'Play' },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, group: 'Play' },
  { to: '/achievements', label: 'Achievements', icon: Award, group: 'Play' },
  { to: '/ai', label: 'LawLink AI', icon: Bot, group: 'Help' },
  { to: '/emergency', label: 'Emergency Help', icon: Siren, tone: 'danger', group: 'Help' },
]

export const NAV_GROUPS = ['Learn', 'Play', 'Help']

/** Bottom bar on mobile shows the five highest-value destinations. */
export const MOBILE_NAV = ['/dashboard', '/journey', '/daily', '/learn', '/ai']

/** Routes outside the sidebar that still need a document title. */
const EXTRA_TITLES = { '/profile': 'Profile', '/search': 'Search', '/about': 'About', '/login': 'Sign in', '/lesson': 'Lesson' }

/** "Dashboard · LawLink" style title for a pathname. */
export function titleFor(pathname) {
  const hit =
    NAV_ITEMS.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`))?.label ??
    Object.entries(EXTRA_TITLES).find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1]
  const label = pathname === '/dashboard' ? 'Dashboard' : hit
  if (pathname === '/') return 'LawLink — Know Your Rights. Level Up Your Legal IQ.'
  return label ? `${label} · LawLink` : 'LawLink'
}

export const BRAND = {
  name: 'LawLink',
  tagline: 'Legal literacy, gamified',
  icon: Shield,
}
