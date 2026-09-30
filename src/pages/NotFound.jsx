/**
 * 404. One serif numeral, one question answered, three ways out.
 *
 * v2 notes (docs/council):
 *   - The 404 numeral is one of only four permitted serif roles (R4), and
 *     `.display` is banned on any integer — so it is neither.
 *   - The blurred orb and its 9-second pulse are gone. They were a third
 *     infinite loop, and R5 permits exactly two in the whole product.
 *   - One primary button, one ghost. The ghost carries the leading icon.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Sparkles, Siren, ArrowRight, Compass } from 'lucide-react'
import { Button, IconBadge } from '../components/ui/index.jsx'

const ease = [0.16, 1, 0.3, 1]

const QUICK = [
  { to: '/learn', label: 'Learn the law', body: 'Eight topics, in plain words.', icon: GraduationCap },
  { to: '/ai', label: 'Ask LawLink AI', body: 'Describe your situation.', icon: Sparkles },
  { to: '/emergency', label: 'Emergency help', body: 'Verified helplines.', icon: Siren },
]

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[62vh] max-w-2xl flex-col items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease }}
        className="w-full text-center"
      >
        <div className="serif text-[72px] leading-none tracking-[-0.03em] text-fg-dim sm:text-[96px]">
          404
        </div>

        <h1 className="t1 mt-5">This page isn’t part of the journey.</h1>
        <p className="copy measure mx-auto mt-3">
          The link may be old, or the address may have changed. Nothing is lost — your XP, streak and
          badges are exactly where you left them.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Button as={Link} to="/dashboard" variant="primary" icon={Compass}>
            Back to dashboard
          </Button>
          <Button as={Link} to="/" variant="ghost" iconRight={ArrowRight}>
            Go to home
          </Button>
        </div>

        <div className="mt-10 grid gap-2.5 sm:grid-cols-3">
          {QUICK.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="pressable flex items-start gap-3 p-4 text-left"
            >
              <IconBadge icon={q.icon} tone="electric" size="sm" />
              <span className="min-w-0">
                <span className="t3 block">{q.label}</span>
                <span className="caption mt-0.5 block">{q.body}</span>
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
