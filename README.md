# LawLink — Gamified Legal Literacy Platform

> **Know Your Rights. Level Up Your Legal IQ.**
> Indian legal information turned into real-life scenarios, XP, badges and levels.

A working prototype of a gamified legal-literacy platform for Indian college students and young
adults. Not a static mockup — every feature is clickable and the full demo loop runs end to end.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173> (if 5173 is busy Vite prints the next port).

### Fastest path to the demo

1. Open the homepage.
2. Click **Start Learning** → on the sign-in page click **Enter Demo Mode**.
   This loads a realistic account: **Level 4 · Legal Explorer · 1,850 XP · 6-day streak ·
   4 badges · 1 module complete · 3 partially complete.**
3. Press **Legal Journey** in the sidebar to show the map.

---

## What's in the box

| Area | What it does |
| --- | --- |
| **Landing** | Hero, a live Legal XP widget, a playable scenario teaser, the XP economy, topic grid and the emergency strip — all interactive with no signup. |
| **Auth + Demo mode** | Sign in / sign up with real client-side validation, plus a one-click demo account and a reset. |
| **Dashboard** | Level + XP hero card, "Your Impact" stats, Continue learning, Daily challenge, journey strip, leaderboard summary, Quick help. |
| **Legal Journey** | A vertical game map — 8 modules behind a connector line. Completed nodes glow, the current node pulses, locked nodes say why they are locked. |
| **Lesson player** | Overview → Lessons → Scenarios → Quiz. Each scenario is a decision, then a **WHY**, **your rights**, **what should you do**, the legal basis and the source. |
| **Quiz** | Question-by-question with instant feedback, a `WHY` panel, per-question XP and a final score screen. |
| **Daily Challenge** | One scenario a day, +100 XP, live countdown to midnight, streak calendar. |
| **60-Second Challenge** | Arcade-style timed run with a depleting ring, skip, confetti and a per-module progress readout. |
| **XP / levels / badges** | Animated counters, 8 named levels, 12 badges, level-up modal with particles, badge unlock modal, XP ledger. |
| **Streaks** | Current + longest streak, 7-day calendar, a 7-day streak bonus of +200 XP. |
| **Leaderboard** | Weekly / My College / All India tabs, a real podium, your row highlighted and pinned. Other learners are seeded demo data. |
| **LawLink AI** | A curated, rule-based awareness assistant. Structured answer: legal area → what this means → your rights → what you can do → resource → source → disclaimer. |
| **Search** | Full-text search across topics, scenarios and quiz items, grouped and ranked. |
| **Emergency Help** | Verified Indian helplines, tappable `tel:` actions, categories for legal aid, women, child protection, complaints and education. |
| **Profile** | Editable name, impact stats, level ladder, streak calendar, XP ledger, quiz history, module mastery, reset. |
| **About** | How content is verified, what LawLink is not, every helpline used, and the tech stack. |

---

## XP economy

| Action | XP |
| --- | --- |
| Read a lesson | 20 |
| Complete a scenario | 50 |
| Correct quiz answer | 25 |
| Daily challenge | 100 |
| 60-second challenge | 100 |
| Complete a topic | 150 |
| 7-day streak | 200 |

Levels: Curious Citizen → Law Learner → Rights Rookie → Legal Explorer → Rights Ranger →
Law Guardian → Justice Navigator → Legal Master.

**Demo shortcut:** the demo account sits 150 XP below Rights Ranger. Clear one scenario (+50)
then the daily challenge (+100) and the level-up animation fires — a two-click level-up for the
judges.

---

## Tech stack

- **React 18** + **Vite 5**
- **Tailwind CSS** (design tokens in `tailwind.config.js`, base layer in `src/index.css`)
- **Framer Motion** for all animation
- **lucide-react** for icons
- **React Router 6**
- **Supabase** for cloud persistence, with a **localStorage** driver as the default

### Persistence — dual driver

`src/lib/storage.js` exposes one async interface (`get` / `set` / `remove`) and picks a driver at
runtime:

- No env vars set → **localStorage**. This is the default and is what runs today.
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set → **Supabase**, with localStorage kept as a
  write-through cache.

If a Supabase call ever fails it falls back to local storage and logs a warning, so a network
problem can never take the demo down. The current driver is shown at the bottom of the sidebar.

---

## Enabling Supabase (optional, ~3 minutes)

1. Create a project at <https://supabase.com>.
2. **SQL Editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy `.env.example` to `.env` and fill in the project URL and anon key.
4. Restart `npm run dev`. The sidebar will read **Supabase (cloud)**.

---

## Deploy

The build is a static site in `dist/`. SPA rewrites are already configured for both hosts, so deep
links like `/dashboard` and `/lesson/cybercrime` resolve on refresh.

### Vercel

```bash
npm i -g vercel
vercel          # framework: Vite · build: npm run build · output: dist
```

`vercel.json` is committed and sets the rewrite and asset caching.

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

`public/_redirects` is committed and handles the rewrite.

### Any other static host

Upload `dist/` and rewrite all paths to `/index.html`.

---

## Legal accuracy — please read

This is an **educational** product. Two rules were enforced across every module:

1. **Nothing invented.** Every scenario and quiz item carries a `law`, a `source` URL and a
   `lastVerified` date. Where a section number could not be verified, the law is named in words
   instead of guessing a number. Only these phone numbers appear anywhere in the app:
   `112 · 100 · 101 · 108 · 1076 · 1073 · 1091 · 1098 · 181 · 1930 · 1915 · 1033`.
2. **Never presented as advice.** "LawLink provides legal awareness and educational information
   only. It is not a substitute for professional legal advice." appears in the footer, on the
   scenario and quiz payoff screens, throughout the AI responses, and on the Emergency page.

Laws and helplines change. The Emergency page states its verification date and tells the reader to
re-check the linked official source before a real emergency.

---

## Project layout

```
src/
  lib/          gamification engine, store, storage drivers, dates, hooks
  data/         topics/ (8 modules), resources, leaderboard, facts, challenges, aiKnowledge
  components/
    ui/         design-system primitives (Card, ProgressBar, Tabs, LegalBasis, Button…)
    layout/     AppShell, Sidebar, TopBar, MobileNav
    fx/         level-up modal, badge unlock, XP burst, toasts
  pages/        one file per route
supabase/       schema.sql
```

`src/data/SCHEMA.md` and `src/pages/CONTRACT.md` are the authoring contracts — read them before
adding a module or a page so new work matches the existing design system.

---

## Accessibility & polish notes

- Dark-first, high-contrast text; colour is never the only signal (icons and labels accompany it).
- Keyboard accessible: focus rings, `⌘K` to search, `Esc` to close, `Enter` to send in the AI.
- `prefers-reduced-motion` is respected — animations collapse to instant transitions.
- The app is wrapped in an error boundary so a single page failure cannot white-screen the demo.
