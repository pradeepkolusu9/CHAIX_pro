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
import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { NAV_ITEMS, NAV_GROUPS, BRAND } from './nav.js'
import { useStore } from '../../lib/store.jsx'
import { formatNumber } from '../../lib/dates.js'
import { levelNumber } from '../../lib/gamification.js'
import { IconBadge, Monogram } from '../ui/index.jsx'
import { SignOutConfirm } from './SignOutConfirm.jsx'

export function Sidebar({ onNavigate }) {
  const { profile, level, backend } = useStore()
  const [confirmOut, setConfirmOut] = useState(false)

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[248px] self-start shrink-0 flex-col border-r border-white/[0.07] bg-pure/60 backdrop-blur-xl lg:flex">
        <div className="flex h-full flex-col">
          {/* brand — the only dot-grid in the chrome */}
          <div className="relative shrink-0 overflow-hidden">
            <div className="dotgrid pointer-events-none absolute inset-0" aria-hidden="true" />
            <Link to="/" onClick={onNavigate} className="relative flex items-center gap-2.5 px-5 py-5">
              <IconBadge icon={BRAND.icon} tone="solid" size="md" />
              <span className="min-w-0 leading-tight">
                <span className="block font-sans text-[15px] font-extrabold tracking-tight">LAWLINK</span>
                <span className="eyebrow block truncate">Legal literacy, gamified</span>
              </span>
            </Link>
          </div>

          <div className="mx-5 h-px shrink-0 bg-white/[0.06]" />

          {/* nav */}
          <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-3">
            {NAV_GROUPS.map((group) => (
              <div key={group} className="mb-4">
                <div className="eyebrow mb-1.5 px-3 !text-fg-dim">{group}</div>
                <div className="space-y-0.5">
                  {NAV_ITEMS.filter((i) => i.group === group).map(({ to, label, icon: NavIcon, end, tone }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `nav-pill ${isActive ? 'nav-pill-active' : ''} ${tone === 'danger' && !isActive ? 'text-danger' : ''}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition-colors ${
                              isActive ? 'tile tile-solid' : tone === 'danger' ? 'tile tile-danger' : 'text-fg-dim'
                            }`}
                          >
                            <NavIcon size={18} strokeWidth={2} />
                          </span>
                          <span className="truncate">{label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
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

            <div className="flex items-center justify-between gap-2 px-3 pt-1" title={`Progress is stored: ${backend}`}>
              {profile?.isDemo ? (
                <span className="chip-xp whitespace-nowrap">Demo</span>
              ) : (
                <span className="caption">{backend}</span>
              )}
              <button
                onClick={() => setConfirmOut(true)}
                className="btn-quiet btn-sm whitespace-nowrap"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
      {/* outside the <aside>: its backdrop-filter would become the modal's containing block */}
      <SignOutConfirm open={confirmOut} onClose={() => setConfirmOut(false)} />
    </>
  )
}
