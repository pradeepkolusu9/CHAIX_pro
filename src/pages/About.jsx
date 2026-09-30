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
  SectionHeading,
  Card,
  LegalBasis,
  VerifiedTag,
  DisclaimerNote,
  Button,
  Pill,
  Sigil,
} from '../components/ui/index.jsx'
import { RESOURCES, DISCLAIMER, VERIFIED_ON } from '../data/resources.js'
import { getModuleById, MODULES } from '../data/modules.js'
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
    <div className="mx-auto max-w-[900px] space-y-10 pb-4">
      {/* ---------------------------------------------------------- 1. hero */}
      <motion.section {...rise(0)} className="sheet-lg sheet-focal p-5 sm:p-7">
        <div className="eyebrow">About &amp; methodology</div>
        <h1 className="t1 mt-3 max-w-2xl">How LawLink was built and checked</h1>
        <p className="lead measure mt-4">
          LawLink is a legal-literacy app for India, built for students and first-time users who need to
          know what the law actually says and what to do next. It turns eight areas of everyday legal
          life into eight modules of short lessons, branching scenarios and quizzes, backed by a
          directory of officially published helplines.
        </p>
        <p className="copy measure mt-3">
          The whole product is a prototype, and this page exists to make that auditable: how the content
          was checked, which sources are cited, what the numbers in it mean, and — just as important —
          what LawLink is not.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-y-4 divide-x divide-white/[0.05] sm:grid-cols-4">
          {[
            { label: 'Modules', value: MODULES.length },
            { label: 'Scenarios', value: SCENARIO_COUNT },
            { label: 'Quiz questions', value: QUIZ_COUNT },
            { label: 'Sources verified', value: VERIFIED_ON },
          ].map((s) => (
            <div key={s.label} className="px-4 first:pl-0">
              <div className="eyebrow mb-1.5">{s.label}</div>
              <div className="num-lg">{s.value}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ------------------------------------------------- 2. why this exists */}
      <section>
        <SectionHeading
          eyebrow="Why this exists"
          title="Three problems, one product"
          sub="Everything in LawLink traces back to one of these."
        />
        <div className="divide-y divide-white/[0.05]">
          {WHY.map((w, i) => (
            <motion.div key={w.title} {...inView} className="flex items-start gap-4 py-4">
              <span className="num mt-0.5 w-4 shrink-0 text-fg-dim">0{i + 1}</span>
              <div className="min-w-0">
                <h3 className="t3">{w.title}</h3>
                <p className="copy measure mt-1.5">{w.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------ 3. how content is verified */}
      <section>
        <SectionHeading
          eyebrow="Methodology"
          title="Where every claim comes from"
          sub="A legal-education product is only as good as its weakest citation, so here is the method in full."
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <ol className="divide-y divide-white/[0.05]">
            {METHOD.map((m, i) => (
              <motion.li
                key={m.title}
                {...inView}
                className="flex items-start gap-4 py-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                  <m.icon size={16} className="text-fg-muted" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <h3 className="t3">
                    <span className="num mr-2 text-fg-dim">0{i + 1}</span>
                    {m.title}
                  </h3>
                  <p className="copy measure mt-1.5">{m.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          {/* real values, read straight out of the Cybercrime module */}
          <motion.div {...inView} className="space-y-3">
            <Card className="p-4 sm:p-5">
              <div className="eyebrow">Worked example</div>
              <h3 className="t2 mt-2 flex items-center gap-2.5">
                <Sigil id={EXAMPLE.id} size={18} className="shrink-0 text-fg-dim" />
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
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="eyebrow">Who to approach</div>
              <div className="t3 mt-2">{EXAMPLE.authority.name}</div>
              <p className="copy mt-1.5">{EXAMPLE.authority.role}</p>
              <a
                href={EXAMPLE.authority.link}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-1.5 text-body font-semibold text-electric-300 underline decoration-electric-500/40 underline-offset-2 hover:decoration-electric-400"
              >
                {EXAMPLE.authority.link.replace(/^https?:\/\//, '')}
                <ExternalLink size={13} strokeWidth={2.3} />
              </a>
              <p className="caption measure mt-3">
                The same block — legal basis, official source, last-verified date — is attached to every
                one of the {MODULES.length} modules, {SCENARIO_COUNT} scenarios and {QUIZ_COUNT} quiz
                questions in LawLink. Open any lesson to see it.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------- 4. what LawLink is not */}
      <section>
        <SectionHeading
          eyebrow="What LawLink is not"
          title="Stated plainly, because the stakes are real"
        />
        <Card className="p-4 sm:p-5">
          <ul className="divide-y divide-white/[0.05]">
            {NOT_A.map((line) => (
              <li key={line} className="flex items-start gap-2.5 py-2.5">
                <XCircle size={15} className="mt-0.5 shrink-0 text-danger" strokeWidth={2.3} />
                <span className="copy">{line}</span>
              </li>
            ))}
            <li className="flex items-start gap-2.5 pt-2.5">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-good" strokeWidth={2.3} />
              <span className="copy">
                What it is: a map. It shows you which law applies, which official body runs it, and
                what the first step is — then it points you to a real lawyer, a legal aid clinic or a
                court.
              </span>
            </li>
          </ul>
          <DisclaimerNote
            className="mt-4"
            text={`${DISCLAIMER} If you are in immediate danger, call 112 or go to the nearest police station — do not use an app.`}
          />
        </Card>
      </section>

      {/* ---------------------------------------- 5. emergency numbers used */}
      <section>
        <SectionHeading
          eyebrow="Emergency numbers used"
          title="Every number in LawLink, with its source"
          sub={`All of these were checked against the operating body's own publication on ${VERIFIED_ON}.`}
          action={
            <Button as={Link} to="/emergency" variant="ghost" size="sm" iconRight={ArrowRight}>
              Open the emergency page
            </Button>
          }
        />

        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="danger" icon={Siren}>
              112 is the primary number
            </Pill>
            <Pill>Works on any network · free · police, fire and ambulance</Pill>
          </div>
          <p className="copy measure mt-3">
            If you only remember one number, remember <span className="num text-danger">112</span>. It
            routes to police, fire and ambulance in most states from any mobile network at no cost.
            Everything below is a specialist line that is faster for one specific situation.
          </p>
        </Card>

        <ul className="mt-3 divide-y divide-white/[0.05]">
          {NUMBERS.map((r) => {
            const primary = r.number === '112'
            return (
              <motion.li key={r.id} {...inView} className="flex items-start gap-4 py-3.5">
                <span
                  className={`num w-14 shrink-0 text-center text-lg ${primary ? 'text-danger' : 'text-fg'}`}
                >
                  {r.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="t3">{r.name}</h3>
                    {primary && <Pill tone="danger">Primary</Pill>}
                  </div>
                  <p className="copy measure mt-1">{r.about}</p>
                  <a
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-caption font-semibold text-electric-300 hover:underline"
                  >
                    <Globe size={11} strokeWidth={2.4} />
                    {r.source}
                  </a>
                </div>
              </motion.li>
            )
          })}
        </ul>

        <DisclaimerNote
          compact
          className="mt-3"
          text={`Helplines change. These numbers were verified on ${VERIFIED_ON} — always re-check against the official website before a real emergency, and prefer the operator's own site or a local police station if a line does not connect.`}
        />
      </section>

      {/* ----------------------------------------------- 6. technology */}
      <section>
        <SectionHeading
          eyebrow="Technology"
          title="What is actually under the hood"
          sub="No inflated claims, including the one that would have been easiest to fake."
        />
        <div className="divide-y divide-white/[0.05]">
          {TECH.map((t) => (
            <motion.div key={t.title} {...inView} className="flex items-start gap-4 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                <t.icon size={16} className="text-fg-muted" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h3 className="t3">{t.title}</h3>
                <p className="copy measure mt-1.5">{t.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------ 7. data & privacy */}
      <section>
        <SectionHeading
          eyebrow="Data & privacy"
          title="What is collected, where it goes, and what is not"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <HardDrive size={16} className="text-fg-muted" strokeWidth={2.2} />
              <h3 className="t3">What is stored</h3>
            </div>
            <ul className="mt-3 space-y-1.5">
              {[
                'The name, email and college you type on the sign-up form.',
                'XP, level, streak, badges, per-module lesson and scenario progress, quiz scores.',
                'A recent-activity ledger of your own XP awards.',
              ].map((line) => (
                <li key={line} className="copy flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fg-faint" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Pill tone={cloud ? 'electric' : 'default'} icon={cloud ? Cloud : HardDrive}>
                Currently: {backend}
              </Pill>
            </div>
            <p className="caption measure mt-3">
              Right now this build is running on {backend.toLowerCase()}, so the data never leaves your
              device. If a Supabase project is configured the same record is written to one private row
              keyed to this browser, and the app falls back to local storage automatically if the cloud
              is unreachable.
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <Lock size={16} className="text-good" strokeWidth={2.2} />
              <h3 className="t3">What is not</h3>
            </div>
            <ul className="mt-3 space-y-1.5">
              {[
                { lead: 'No payment data.', rest: ' There is no payment step, no card field and no subscription anywhere in LawLink.' },
                { lead: 'No third-party analytics or ad trackers.', rest: ' No pixels, no beacons, no session recording.' },
                { lead: 'The AI assistant sends nothing out.', rest: ' It is a rule-based matcher running entirely in your browser over a bundled knowledge base — your question is not transmitted to any server or model provider.' },
                { lead: 'The leaderboard is sample data.', rest: ' The other names and XP figures are seeded so the board has a realistic shape; only your own row reflects real play, and nothing about you is sent anywhere.' },
              ].map((x) => (
                <li key={x.lead} className="copy flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fg-faint" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-fg">{x.lead}</span>
                    {x.rest}
                  </span>
                </li>
              ))}
              <li className="copy flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fg-faint" aria-hidden="true" />
                <span>Clearing site data, or using your profile's reset, deletes everything.</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* -------------------------------------------------- 8. footer CTA */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="eyebrow">Start here</div>
          <p className="copy measure mt-1.5">
            You can work through a whole module in about fifteen minutes, and the first scenario gives
            you XP the moment you answer it. Nothing here needs a signup to read.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {/* the ONE primary button on this screen */}
          <Button as={Link} to="/learn" variant="primary" iconRight={ArrowRight}>
            Start learning
          </Button>
          <Button as={Link} to="/emergency" variant="ghost" icon={Siren}>
            Emergency help
          </Button>
        </div>
      </Card>
    </div>
  )
}
