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
  { to: '/journey', label: 'Legal Journey', icon: Map, group: 'Learn' },
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

export const BRAND = {
  name: 'LawLink',
  tagline: 'Legal literacy, gamified',
  icon: Shield,
}
