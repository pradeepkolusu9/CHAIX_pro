import { useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar.jsx'
import { TopBar } from './TopBar.jsx'
import { MobileNav, MobileMenu } from './MobileNav.jsx'
import { EffectsHost, ToastHost } from '../fx/Rewards.jsx'
import { DisclaimerNote } from '../ui/index.jsx'

/**
 * Ambient background. Three fixed composited layers, zero scroll repaint:
 * one lamp (blue top-left, gold bottom-right — violet is level-identity only and
 * is deliberately absent), a grain tile so the dark UI does not read as flat
 * plastic, and a vignette so long pages settle at the bottom.
 */
function Ambient() {
  return (
    <div className="backdrop-fx" aria-hidden="true">
      <div className="fx-lamp" />
      <div className="fx-grain" />
      <div className="fx-vignette" />
    </div>
  )
}

export function AppShell() {
  const [menu, setMenu] = useState(false)
  const loc = useLocation()

  return (
    <div className="flex min-h-screen">
      <Ambient />
      <Sidebar />
      <MobileMenu open={menu} onClose={() => setMenu(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMenu={() => setMenu(true)} />

        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pb-12 sm:pt-7"
        >
          <Outlet />
        </motion.main>

        <footer className="px-4 pb-24 pt-8 sm:px-6 sm:pb-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-4 border-t border-white/[0.05] pt-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              {/* The single persistent disclaimer instance in the app. Pages may add
                  one inline instance where it is load-bearing (scenario reveal).
                  Was `caption text-fg-dim` at 1.62:1 — unreadable, and the red 112
                  lost its hue entirely. Now 13px fg-muted with a bold 112. */}
              <p className="disclaimer">
                LawLink provides legal awareness and educational information only. It is not a
                substitute for professional legal advice. Laws and helplines change — verify against
                the linked official source, and see{' '}
                <Link to="/about" className="text-electric-300 hover:underline">
                  About &amp; methodology
                </Link>
                . In immediate danger call <strong className="text-danger">112</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-sans text-caption font-semibold text-fg-dim">
              <Link to="/about" className="hover:text-fg">
                About
              </Link>
              <Link to="/emergency" className="hover:text-fg">
                Emergency
              </Link>
              <Link to="/search" className="hover:text-fg">
                Search
              </Link>
              <Link to="/profile" className="hover:text-fg">
                Profile
              </Link>
            </div>
          </div>
        </footer>
      </div>

      <MobileNav />
      <EffectsHost />
      <ToastHost />
    </div>
  )
}

/** Public (unauthenticated) shell used by the landing and auth pages. */
export function PublicShell({ children }) {
  return (
    <div className="min-h-screen">
      <Ambient />
      {children}
    </div>
  )
}
