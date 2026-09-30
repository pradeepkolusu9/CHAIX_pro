/**
 * Mobile chrome — the bottom tab bar (<lg) and the slide-over menu.
 *
 * Behaviour is unchanged: five destinations, the same drawer, the same demo
 * controls. Only the surfaces and type are re-cut for v2 —
 *   - `overlay-panel` for both (L3 is the only place a backdrop-blur is legal).
 *   - Tab labels at `micro`, the type floor. The old `text-[10px]` is gone.
 *   - The drawer owns no flame loop: the top-bar chip already has it, and two
 *     looping flames would be in the same viewport.
 */
import { useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame, LogOut, RotateCcw, Siren } from 'lucide-react'
import { NAV_ITEMS, BRAND, MOBILE_NAV } from './nav.js'
import { useStore, useActions } from '../../lib/store.jsx'
import { formatNumber } from '../../lib/dates.js'
import { levelNumber } from '../../lib/gamification.js'
import { IconBadge, Monogram } from '../ui/index.jsx'

/** Bottom tab bar — real mobile navigation, not a shrunken sidebar. */
export function MobileNav() {
  return (
    <nav className="safe-b overlay-panel fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {MOBILE_NAV.map((to) => {
          const item = NAV_ITEMS.find((n) => n.to === to)
          if (!item) return null
          const Icon = item.icon
          return (
            <NavLink
              key={to}
              to={to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-2.5 font-sans text-micro font-semibold transition-colors duration-200 ${
                  isActive ? 'text-fg' : 'text-fg-dim'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="mobnav"
                      className="absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-electric-400"
                    />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                  <span className="max-w-full truncate px-1">{item.label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

/** Slide-over sheet used for full navigation on small screens. */
export function MobileMenu({ open, onClose }) {
  const { profile, level, streak } = useStore()
  const { actions } = useActions()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] lg:hidden"
        >
          <div className="absolute inset-0 bg-ink-950/40" onClick={onClose} />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="overlay-panel absolute inset-y-0 left-0 flex w-[280px] max-w-[86vw] flex-col border-r border-white/[0.06]"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2.5">
                <IconBadge icon={BRAND.icon} tone="electric" size="sm" />
                <span className="font-sans text-[15px] font-extrabold tracking-tight">LAWLINK</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-fg-dim transition-colors hover:text-fg"
                aria-label="Close menu"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mx-4 h-px bg-white/[0.06]" />

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
              {NAV_ITEMS.map(({ to, label, icon: NavIcon, end, tone }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-pill ${isActive ? 'nav-pill-active' : ''} ${
                      tone === 'danger' && !isActive ? 'text-danger' : ''
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <NavIcon
                        size={17}
                        strokeWidth={isActive ? 2.3 : 2}
                        className={isActive ? 'text-fg' : ''}
                      />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* the drawer is already a surface, so the profile block is not a
                card inside it — just a hairline and a row */}
            <div className="border-t border-white/[0.06] p-3">
              <div className="flex items-center gap-2.5 px-1 py-1.5">
                <Monogram name={profile?.name || 'Guest'} userId={profile?.userId} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="t3 truncate">{profile?.name || 'Guest'}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="num text-violet2-300">{levelNumber(level.level)}</span>
                    <span className="text-fg-faint" aria-hidden="true">
                      ·
                    </span>
                    <span className="num text-fg-dim">{formatNumber(level.xp)} XP</span>
                    <span className="flex items-center gap-1 text-warn">
                      <Flame size={11} strokeWidth={2.4} />
                      <span className="tnum font-bold">{streak?.current || 0}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex gap-1.5">
                <Link to="/profile" onClick={onClose} className="btn btn-ghost btn-sm flex-1">
                  Profile
                </Link>
                {profile?.isDemo && (
                  <>
                    <button
                      onClick={() => actions.loadDemo()}
                      className="btn btn-quiet btn-sm"
                      title="Reload demo"
                      aria-label="Reload demo"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button
                      onClick={() => actions.logout()}
                      className="btn btn-quiet btn-sm"
                      title="Sign out"
                      aria-label="Sign out"
                    >
                      <LogOut size={12} />
                    </button>
                  </>
                )}
              </div>

              <Link
                to="/emergency"
                onClick={onClose}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-danger/[0.10] px-3 py-2.5 font-sans text-caption font-bold text-danger transition-colors duration-200 hover:bg-danger/[0.16]"
              >
                <Siren size={14} />
                Emergency help
              </Link>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
