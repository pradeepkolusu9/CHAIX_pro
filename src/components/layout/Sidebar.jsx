/**
 * Sidebar — desktop chrome (lg+).
 *
 * v2 notes (docs/council/01 R7, R10; 03 R1, R3):
 *   - Selection is TONAL: `bg-white/[0.06]` plus one inset highlight. There is
 *     no blue glow and no accent bar competing with the rest of the chrome.
 *   - The brand mark is a lucide `Shield` in an `IconBadge`. No emoji, no
 *     gradient, and exactly one dot-grid — in the brand area, desktop only.
 *   - The avatar is a `<Monogram />`, so two people never share a colour twice
 *     and no animal ever renders as a face.
 */
import { NavLink, Link } from 'react-router-dom'
import { LogOut, RotateCcw, Wifi, WifiOff } from 'lucide-react'
import { NAV_ITEMS, BRAND } from './nav.js'
import { useStore, useActions } from '../../lib/store.jsx'
import { formatNumber } from '../../lib/dates.js'
import { levelNumber } from '../../lib/gamification.js'
import { IconBadge, Monogram } from '../ui/index.jsx'

export function Sidebar({ onNavigate }) {
  const { profile, level, backend, cloud } = useStore()
  const { actions } = useActions()

  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col border-r border-white/[0.06] lg:flex">
      <div className="flex h-full flex-col">
        {/* brand — the only dot-grid in the chrome */}
        <div className="relative shrink-0 overflow-hidden">
          <div className="dotgrid pointer-events-none absolute inset-0" aria-hidden="true" />
          <Link
            to="/"
            onClick={onNavigate}
            className="relative flex items-center gap-2.5 px-5 py-5"
          >
            <IconBadge icon={BRAND.icon} tone="electric" size="md" />
            <span className="min-w-0 leading-tight">
              <span className="block font-sans text-[15px] font-extrabold tracking-tight">LAWLINK</span>
              <span className="eyebrow block truncate">Legal literacy, gamified</span>
            </span>
          </Link>
        </div>

        <div className="mx-5 h-px shrink-0 bg-white/[0.06]" />

        {/* nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: NavIcon, end, tone }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
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

        {/* profile block */}
        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <NavLink
            to="/profile"
            onClick={onNavigate}
            className={({ isActive }) => `nav-pill mb-1.5 ${isActive ? 'nav-pill-active' : ''}`}
          >
            <Monogram name={profile?.name || 'Guest'} userId={profile?.userId} size="xs" />
            <span className="min-w-0 flex-1">
              <span className="t3 block truncate">{profile?.name || 'Guest'}</span>
              <span className="mt-0.5 flex items-center gap-1.5">
                <span className="num text-violet2-300">{levelNumber(level.level)}</span>
                <span className="text-fg-faint" aria-hidden="true">
                  ·
                </span>
                <span className="num text-fg-dim">{formatNumber(level.xp)} XP</span>
              </span>
            </span>
          </NavLink>

          {/* where progress is actually stored */}
          <div className="flex items-center gap-2 px-3 pb-1" title="Where your progress is stored">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${cloud ? 'bg-good' : 'bg-fg-faint'}`}
              aria-hidden="true"
            />
            {cloud ? (
              <Wifi size={11} className="shrink-0 text-fg-dim" />
            ) : (
              <WifiOff size={11} className="shrink-0 text-fg-dim" />
            )}
            <span className="truncate caption">{backend}</span>
          </div>

          {profile?.isDemo && (
            <div className="mt-1 flex gap-1.5 px-1.5">
              <button
                onClick={() => actions.loadDemo()}
                className="btn btn-ghost btn-sm flex-1"
                title="Reload the demo account state"
              >
                <RotateCcw size={12} />
                Reload
              </button>
              <button
                onClick={() => actions.logout()}
                className="btn btn-quiet btn-sm"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
