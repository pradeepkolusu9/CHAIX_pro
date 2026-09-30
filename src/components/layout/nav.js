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
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/journey', label: 'Legal Journey', icon: Map },
  { to: '/daily', label: 'Daily Challenge', icon: Zap },
  { to: '/speed', label: '60-Second Challenge', icon: Timer },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/achievements', label: 'Achievements', icon: Award },
  { to: '/ai', label: 'LawLink AI', icon: Bot },
  { to: '/emergency', label: 'Emergency Help', icon: Siren, tone: 'danger' },
]

/** Bottom bar on mobile shows the five highest-value destinations. */
export const MOBILE_NAV = ['/', '/journey', '/daily', '/learn', '/ai']

export const BRAND = {
  name: 'LawLink',
  tagline: 'Legal literacy, gamified',
  icon: Shield,
}
