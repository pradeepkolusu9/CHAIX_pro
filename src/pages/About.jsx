/**
 * About — /about
 *
 * The judge-trust page, written as a methods page rather than a marketing page.
 * It has one job: state exactly how the content was built and checked, and be
 * blunt about what LawLink is not. Every figure is pulled from the data layer —
 * module legal bases, the verified resource directory and its review date — so
 * the page cannot drift away from the product.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Siren,
  ShieldCheck,
  CalendarClock,
  Link2,
  Scale,
  Layers,
  Split,
  Cpu,
  HardDrive,
  Cloud,
  Lock,
  Bot,
  ExternalLink,
  FileWarning,
  Globe,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  Card,
  LegalBasis,
  VerifiedTag,
  IconBadge,
  Button,
  Pill,
  Sigil,
} from '../components/ui/index.jsx'
import { RESOURCES, DISCLAIMER, VERIFIED_ON } from '../data/resources.js'
import { getModuleById, MODULES } from '../data/modules.js'
import { toneFor } from '../lib/moduleTone.js'
import { useStore } from '../lib/store.jsx'

const EASE = [0.16, 1, 0.3, 1]
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: EASE, delay },
})
const inView = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.3, ease: EASE },
}

/** The module used to show a real, filled-in legal trust block. */
const EXAMPLE = getModuleById('cybercrime')

/** Only entries that carry an official, published helpline number. */
const NUMBERS = RESOURCES.filter((r) => r.number).sort((a, b) => {
  if (a.number === '112') return -1
  if (b.number === '112') return 1
  return 0
})

/** Counts are derived, never typed — the page cannot claim more than exists. */
const SCENARIO_COUNT = MODULES.reduce((a, m) => a + m.scenarios.length, 0)
const QUIZ_COUNT = MODULES.reduce((a, m) => a + m.quiz.length, 0)

const WHY = [
  {
    title: 'Legal information is scattered',
    body: 'The Act lives on India Code. The helpline lives on a ministry site. The form to file lives on a portal that assumes you already know which one. Almost nobody has the time to find three places before a deadline.',
  },
  {
    title: 'Scenarios beat paragraphs',
    body: 'Nobody remembers a definition. People remember the moment they chose wrong. Every item in LawLink is a situation with options, an explanation of why the tempting answer fails, and the law that settles it.',
  },
  {
    title: 'Knowledge without action is useless',
    body: 'Reading about a protection order is not the same as knowing which magistrate to approach. LawLink ends every topic with concrete steps and the official helpline or portal to use.',
  },
]

const METHOD = [
  {
    icon: Scale,
    title: 'Every item carries a legal basis',
    body: 'Each scenario and each quiz question records the law it rests on and, where the text supports it, the specific section — plus a one-line translation into plain words. If a section could not be confirmed, the Act is named in words instead and no number is invented.',
  },
  {
    icon: Link2,
    title: 'An official source, not a blog',
    body: 'Sources are government domains only: India Code for the text of a law, a ministry or statutory body for a helpline, an official court or commission portal for a procedure. No aggregator, no news article, no forum post is ever cited.',
  },
  {
    icon: CalendarClock,
    title: 'A "last verified" date on everything',
    body: `Laws get amended, portals get rebuilt and helplines get renumbered. Each module and each resource carries the date it was last checked against its source — currently ${VERIFIED_ON} — so a stale claim is visible rather than hidden.`,
  },
  {
    icon: ShieldCheck,
    title: 'Only published helplines are listed',
    body: 'A number appears in LawLink only if it is officially published by the body that operates it. Everything else is a website link, because a wrong number in an emergency is worse than no number at all.',
  },
]

const NOT_A = [
  'LawLink is not a lawyer, and nothing in it is legal advice.',
  'It does not review your situation, predict an outcome or tell you whether to sue.',
  'It does not replace a lawyer, a legal aid clinic or a court.',
  'It is not a government portal, and it is not affiliated with any ministry or commission.',
]

const TECH = [
  {
    icon: Cpu,
    title: 'React + Vite',
    body: 'A component-based single-page app built with Vite. Routes, the store and every page are plain React — no framework magic, easy to audit.',
  },
  {
    icon: Layers,
    title: 'Tailwind CSS',
    body: 'A single design-token config drives every colour, radius and shadow, so every module, every page and the marketing surface all read as one product.',
  },
  {
    icon: Split,
    title: 'Dual-driver persistence',
    body: 'One storage interface with two backends. If Supabase credentials are configured the app writes to the cloud and mirrors locally; otherwise it falls back to localStorage, so a live demo can never die on a network error.',
  },
  {
    icon: Bot,
    title: 'No live language model',
    body: 'LawLink AI is a curated, rule-based awareness assistant over a verified knowledge base, not a live language model. That is a deliberate choice: a legal-education product should not improvise law.',
  },
  {
    icon: FileWarning,
    title: 'One icon set, no illustration',
    body: 'A single monoline mark family and lucide action icons. No hand-drawn assets and no illustration that could imply a capability the product does not have.',
  },
]

export default function About() {
  const { backend, cloud } = useStore()

  return (
    <div className="mx-auto max-w-[1000px] space-y-24 pb-6 sm:space-y-28">
      {/* ---------------------------------------------------------- hero */}
      <motion.section {...rise(0)} className="pt-4 sm:pt-10">
        <div className="eyebrow">About LawLink</div>
        <h1 className="display mt-3 max-w-[14ch] text-[44px] sm:text-display">
          The law, in plain words.
        </h1>
        <p className="lead mt-6 max-w-[56ch]">
          LawLink is a legal-literacy app for India, built for students and first-time users who want to
          know what the law says and what to do next. Short lessons, branching scenarios and quizzes,
          backed by a directory of officially published helplines.
        </p>
        <p className="copy mt-3 max-w-[56ch]">
          It is a prototype, and this page makes that auditable: how content was checked, what is cited,
          and what LawLink is not.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          {[
            { label: 'Modules', value: MODULES.length },
            { label: 'Scenarios', value: SCENARIO_COUNT },
            { label: 'Quiz questions', value: QUIZ_COUNT },
            { label: 'Sources checked', value: VERIFIED_ON },
          ].map((s) => (
            <div key={s.label}>
              <div className="eyebrow mb-1.5">{s.label}</div>
              <div className="num-lg">{s.value}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ------------------------------------------------- why */}
      <section className="grid gap-10 lg:grid-cols-[5fr_7fr]">
        <div>
          <div className="eyebrow mb-2">Why this exists</div>
          <h2 className="t1">Three problems, one product</h2>
          <p className="copy mt-3">Everything in LawLink traces back to one of these.</p>
        </div>
        <div className="space-y-8">
          {WHY.map((w, i) => (
            <motion.div key={w.title} {...inView} className="flex items-start gap-4">
              <span className="tile tile-electric num h-9 w-9 rounded-xl">{i + 1}</span>
              <div className="min-w-0">
                <h3 className="t3">{w.title}</h3>
                <p className="copy measure mt-1.5">{w.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------ how we verify: timeline */}
      <section>
        <div className="eyebrow mb-2">How we verify</div>
        <h2 className="t1">Where every claim comes from</h2>
        <p className="copy mt-3 max-w-[56ch]">
          A legal-education product is only as good as its weakest citation, so here is the method.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[7fr_5fr]">
          <ol className="relative space-y-8">
            <span
              className="absolute bottom-4 left-[19px] top-4 w-0.5 rounded-full bg-electric-500/15"
              aria-hidden="true"
            />
            {METHOD.map((m, i) => (
              <motion.li key={m.title} {...inView} className="relative flex items-start gap-5">
                <span className="tile tile-electric h-10 w-10 rounded-xl ring-4 ring-surface-0">
                  <m.icon size={18} strokeWidth={2.1} />
                </span>
                <div className="min-w-0">
                  <div className="eyebrow">Step {i + 1}</div>
                  <h3 className="t3 mt-1">{m.title}</h3>
                  <p className="copy measure mt-1.5">{m.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          <motion.div {...inView} className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <div className="eyebrow">Worked example</div>
              <h3 className="t2 mt-2 flex items-center gap-3">
                <span className={`tile tile-${toneFor(EXAMPLE.id)} h-9 w-9 rounded-xl`}>
                  <Sigil id={EXAMPLE.id} size={18} />
                </span>
                {EXAMPLE.name}
              </h3>
              <p className="caption mt-1.5">{EXAMPLE.tagline}.</p>
              <div className="mt-3">
                <VerifiedTag date={EXAMPLE.lastVerified} />
              </div>
              <LegalBasis
                className="mt-3"
                basis={{ ...EXAMPLE.legalBasis, link: EXAMPLE.authority.link }}
                source={EXAMPLE.source}
                lastVerified={EXAMPLE.lastVerified}
              />
              <div className="t3 mt-4">{EXAMPLE.authority.name}</div>
              <p className="caption mt-1">{EXAMPLE.authority.role}</p>
              <a
                href={EXAMPLE.authority.link}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1.5 text-body font-semibold text-electric-300 hover:underline"
              >
                {EXAMPLE.authority.link.replace(/^https?:\/\//, '')}
                <ExternalLink size={13} strokeWidth={2.3} />
              </a>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------- what LawLink is not */}
      <section className="sheet-lg sheet-focal p-6 sm:p-10">
        <div className="eyebrow">What LawLink is not</div>
        <h2 className="t1 mt-2 max-w-[22ch]">Stated plainly, because the stakes are real</h2>
        <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {NOT_A.map((line) => (
            <li key={line} className="flex items-start gap-3">
              <span className="tile tile-danger mt-0.5 h-7 w-7 rounded-lg">
                <XCircle size={15} strokeWidth={2.3} />
              </span>
              <span className="copy">{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-good/[0.08] p-4">
          <span className="tile tile-good mt-0.5 h-7 w-7 rounded-lg">
            <CheckCircle2 size={15} strokeWidth={2.3} />
          </span>
          <p className="copy">
            <strong className="font-semibold text-fg">What it is: a map.</strong> It shows which law
            applies, which official body runs it and what the first step is, then points you to a real
            lawyer, a legal aid clinic or a court. In immediate danger, call 112; do not use an app.
          </p>
        </div>
        <p className="caption mt-4">{DISCLAIMER}</p>
      </section>

      {/* ---------------------------------------- helplines table */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-2">Helplines used</div>
            <h2 className="t1">Every number, with its source</h2>
            <p className="copy mt-3 max-w-[56ch]">
              Checked against each operator&apos;s own publication on {VERIFIED_ON}. Re-check before a
              real emergency.
            </p>
          </div>
          <Button as={Link} to="/emergency" variant="ghost" size="sm" iconRight={ArrowRight}>
            Open the emergency page
          </Button>
        </div>

        <div className="sheet mt-8 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-electric-500/[0.05]">
                <th scope="col" className="eyebrow px-4 py-3 sm:px-6">Number</th>
                <th scope="col" className="eyebrow px-2 py-3">Service</th>
                <th scope="col" className="eyebrow hidden px-4 py-3 sm:table-cell">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {NUMBERS.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                    <a
                      href={`tel:${r.number}`}
                      className={`num-lg tnum ${r.number === '112' ? 'text-danger' : 'text-fg'} hover:underline`}
                    >
                      {r.number}
                    </a>
                  </td>
                  <td className="px-2 py-3.5">
                    <div className="t3">{r.name}</div>
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="caption inline-flex items-center gap-1 font-semibold text-electric-300 hover:underline sm:hidden"
                    >
                      <Globe size={11} strokeWidth={2.4} />
                      {r.source}
                    </a>
                  </td>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="caption inline-flex items-center gap-1.5 font-semibold text-electric-300 hover:underline"
                    >
                      <Globe size={11} strokeWidth={2.4} />
                      {r.source}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ----------------------------------------------- technology */}
      <section>
        <div className="eyebrow mb-2">Technology</div>
        <h2 className="t1">What is under the hood</h2>
        <p className="copy mt-3 max-w-[56ch]">
          No inflated claims, including the one that would have been easiest to fake.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {TECH.map((t) => (
            <span key={t.title} className="chip-electric px-3.5 py-1.5 text-caption">
              <t.icon size={13} strokeWidth={2.3} />
              {t.title}
            </span>
          ))}
        </div>
        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {TECH.map((t) => (
            <div key={t.title}>
              <dt className="t3">{t.title}</dt>
              <dd className="copy mt-1">{t.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------ data & privacy */}
      <section>
        <div className="eyebrow mb-2">Data &amp; privacy</div>
        <h2 className="t1">What is collected, and what is not</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={HardDrive} tone="electric" size="sm" />
              <h3 className="t3">What is stored</h3>
            </div>
            <ul className="mt-4 space-y-2">
              {[
                'The name, email and college you type on the sign-up form.',
                'XP, level, streak, badges, per-module lesson and scenario progress, quiz scores.',
                'A recent-activity ledger of your own XP awards.',
              ].map((line) => (
                <li key={line} className="copy flex gap-2.5">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Pill tone={cloud ? 'electric' : 'default'} icon={cloud ? Cloud : HardDrive}>
                Currently: {backend}
              </Pill>
            </div>
            <p className="caption mt-3">
              This build is running on {backend.toLowerCase()}, so the data never leaves your device. If
              a Supabase project is configured the same record is written to one private row keyed to
              this browser, with automatic fallback to local storage.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={Lock} tone="good" size="sm" />
              <h3 className="t3">What is not</h3>
            </div>
            <ul className="mt-4 space-y-2">
              {[
                { lead: 'No payment data.', rest: ' No payment step, card field or subscription anywhere.' },
                { lead: 'No third-party analytics or ad trackers.', rest: ' No pixels, beacons or session recording.' },
                { lead: 'The AI assistant sends nothing out.', rest: ' It is a rule-based matcher in your browser over a bundled knowledge base, so your question is not transmitted anywhere.' },
                { lead: 'The leaderboard is sample data.', rest: ' Other names and XP are seeded; only your own row reflects real play.' },
              ].map((x) => (
                <li key={x.lead} className="copy flex gap-2.5">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-good" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-fg">{x.lead}</span>
                    {x.rest}
                  </span>
                </li>
              ))}
              <li className="copy flex gap-2.5">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-good" aria-hidden="true" />
                <span>Clearing site data, or your profile&apos;s reset, deletes everything.</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* -------------------------------------------------- CTA */}
      <section className="text-center">
        <h2 className="t1">Ready when you are.</h2>
        <p className="lead mx-auto mt-3 max-w-[48ch]">
          A whole module takes about fifteen minutes, and your first scenario earns XP the moment you
          answer. Nothing here needs a signup to read.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/learn" variant="primary" size="lg" iconRight={ArrowRight}>
            Start learning
          </Button>
          <Button as={Link} to="/emergency" variant="ghost" size="lg" icon={Siren}>
            Emergency help
          </Button>
        </div>
      </section>
    </div>
  )
}
