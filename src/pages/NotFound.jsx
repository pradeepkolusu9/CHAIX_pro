/**
 * 404 — one tile-built illustration, one message, three ways out.
 * The illustration is pure CSS tiles/gradients: "4", a compass tile in place of the 0, "4".
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, GraduationCap, Siren, ArrowRight, Compass } from 'lucide-react'
import { IconBadge } from '../components/ui/index.jsx'

const ease = [0.16, 1, 0.3, 1]

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', body: 'Your XP, streak and next step.', icon: LayoutDashboard, tone: 'electric' },
  { to: '/learn', label: 'Learn', body: 'Eight topics, in plain words.', icon: GraduationCap, tone: 'violet' },
  { to: '/emergency', label: 'Emergency', body: 'Verified helplines, fast.', icon: Siren, tone: 'danger' },
]

const four = (
  <span className="tile tile-electric h-24 w-20 rounded-[28px] text-[64px] font-extrabold leading-none tracking-[-0.04em] sm:h-36 sm:w-28 sm:rounded-[36px] sm:text-[96px]">
    4
  </span>
)

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-1 py-12 text-center">
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative flex items-center justify-center gap-3 sm:gap-5"
      >
        <span className="absolute -left-4 -top-4 h-8 w-8 rounded-xl bg-gradient-to-br from-xp-200 to-xp-400 shadow-glow-xp sm:-left-8 sm:h-12 sm:w-12 sm:rounded-2xl" />
        <span className="absolute -bottom-3 right-2 h-6 w-6 rotate-12 rounded-lg bg-gradient-to-br from-violet2-400 to-violet2-600 opacity-80 shadow-glow-violet sm:h-9 sm:w-9 sm:rounded-xl" />
        {four}
        <span className="tile tile-solid h-28 w-28 rounded-full shadow-glow sm:h-44 sm:w-44">
          <Compass className="h-12 w-12 sm:h-20 sm:w-20" strokeWidth={1.6} />
        </span>
        {four}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease, delay: 0.08 }}
        className="w-full"
      >
        <div className="eyebrow mt-10">Error 404</div>
        <h1 className="t1 mt-2">This page took a wrong turn.</h1>
        <p className="lead measure mx-auto mt-3">
          The link may be old or mistyped. Nothing is lost: your XP, streak and badges are right where you left them.
        </p>

        <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="pressable group flex min-h-[64px] items-center gap-3 p-4">
              <IconBadge icon={l.icon} tone={l.tone} size="md" />
              <span className="min-w-0 flex-1">
                <span className="t3 block">{l.label}</span>
                <span className="caption mt-0.5 block">{l.body}</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-fg-dim transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
