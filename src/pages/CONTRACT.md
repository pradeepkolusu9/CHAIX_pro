# LawLink page contract — DESIGN SYSTEM v2 (read fully before writing)

The design system was rebuilt after a stakeholder rejected v1 as "generic". Every page must be
migrated to v2. The council specs are in `docs/council/` — read the one for your lens.

**Write only the files assigned to you. Do not edit shared files** (`tailwind.config.js`,
`src/index.css`, `src/components/ui/*`, `src/lib/*`, `src/data/*`, `src/App.jsx`, this file).
If you find a bug in a file you do not own, report it — do not edit it.

## What changed and why

v1's problem: every element was a rounded rect with a 1px white border, ~15 per screen, so nothing
was important. Emoji were used as icons. Numbers animated from 0 and could read `0` while the page
said `1,850` elsewhere.

v2 fixes it: **tonal surfaces instead of outlines**, **one hue per job**, **a bound type scale**,
**a real icon system**, and **one focal point per screen**.

## The primitives (import from these — do not reinvent)

```jsx
import { Card, Panel, CardHead, SectionHeading, ProgressBar, StatStrip, LevelSeal, Pill,
         Modal, Tabs, LegalBasis, VerifiedTag, DisclaimerNote, InfoNote, EmptyState,
         Skeleton, IconBadge, Button, Figure, Sigil, sigilGlyph, MODULE_SIGILS,
         Monogram, initialsOf, formatNumber } from '../components/ui/index.jsx'
```

### Surfaces — separation is TONAL. Never add `border border-white/…` to a card.
| class | use |
|---|---|
| `.sheet` / `<Card>` | the default raised surface, 20px radius, no border, no blur |
| `.sheet-lg` / `<Panel>` | large focal surface, 28px radius |
| `.sheet-focal` | add to ONE surface per screen — the single permitted gradient |
| `.pressable` | interactive rows: options, rail rows, selectable items |
| `.overlay-panel` | modals/toasts only — the only place `backdrop-blur` is allowed |

### Type — bound scale. `micro` (11px) is the floor; nothing below it.
| class | size | use |
|---|---|---|
| `.display` | 64px | **words only, max ONE per screen. Banned on any integer.** |
| `.t1` | 34px | page title |
| `.t2` | 21px | section / card title |
| `.t3` | 16px | card title, row label |
| `.lead` | 16px | scenario prose — the one big read per screen |
| `.copy` | 13.5px | body copy |
| `.caption` | 12px | secondary text |
| `.eyebrow` | 11px caps | section eyebrows. **Type, never a glyph.** |
| `.num-xl` | 56px | **max one per screen**, and only if the number is the point |
| `.num-lg` | 30px | supporting figures |
| `.num` | 15px | inline figures |
| `.case-title` | serif 28-32px | **the scenario / case title only** (Lesson) |
| `.serif` | — | the "law" voice: 4 roles max per screen |

Numbers use `<Figure value={n} size="xl|-lg|sm" tone="xp|good|violet" />`. It is correct on first
paint and animates only on change. **Never animate a number that is a fact at first paint.**

### Colour — every hue has exactly one job
| hue | means | never |
|---|---|---|
| `electric-*` blue | action & progress | level identity, "completed" |
| `xp-*` gold | **value earned** | non-XP progress, buttons, borders |
| `violet2-*` | **level identity only** | anywhere else |
| `good` green | verified / correct | decoration |
| `warn` orange | heat: streak, time pressure | **the disclaimer** |
| `danger` red | urgent / hard limit | anything soft |

Budget: **≤2 chrome hues + 1 status hue per screen.** If a fourth hue is nameable, you have over-spent.

### Icons — the emoji era is over
- `<Sigil id="…" size="xs|sm|md|lg|xl|2xl" className="…" />` — domain identity (modules, badges, level).
  Ids: `cybercrime consumer road student workplace privacy safety fundamental` and
  `first-step quick-learner streak-master first-blood perfect-ten legal-legend level-seal`.
  Badge ids that certify a module (`cyber-defender`, `smart-consumer`, `road-warrior`,
  `campus-guardian`, `workplace-rights`, `rights-protector`) alias to that module's mark.
- `sigilGlyph(id)` returns a lucide-shaped component for `IconBadge icon={…}` / `Tabs icon={…}`.
- lucide-react for **actions and state only** (arrow, check, x, lock, play, flame, search, siren).
- **Never mix the two systems in one box** (a lucide glyph and a Sigil at equal size read as two products).
- Data fields are already migrated: modules and badges now have `sigil:` (an id), **not** `emoji:`.
  Leaderboard people have **no** emoji field.
- Avatars: `<Monogram name="Aarav Mehta" size="sm|md" />` — replaces all animal emoji.
- **Budget: ≤6 Sigils + 4 lucide icons above the fold.** One icon per card. Zero in `.chip`,
  zero in `.eyebrow`, zero decorative glyphs in running text. Never two icons in one button.

## Non-negotiable rules

1. **One `variant="primary"` button per screen.** A second full-width blue button is a colour error —
   demote it to `ghost` with a leading `ArrowRight`.
2. **One focal point per screen**, ≥2.2× the weight of everything else. Cover the page with your thumb:
   what is left must be the answer to "what do I do next?"
3. **≤6 elevated surfaces visible at once.** Prefer `divide-y divide-white/[0.05]` flat lists over grids
   of cards. A list row is `<div className="flex items-center gap-3 py-3">` inside a `divide-y`.
4. **One gradient per screen**, on the focal element (`.sheet-focal`). Delete all `blur-3xl` blobs.
5. **Reading measure ≤68ch** (`.measure`). Never let a paragraph run wider.
6. **Motion:** framer-motion only, 0.15–0.35s, ease `[0.16,1,0.3,1]`. **Nothing moves while the user
   is choosing an answer** — motion is banned before the click, which is what buys the reveal.
   Two infinite loops exist in the product: the journey current-node pulse and the streak flame. Add
   no others. `prefers-reduced-motion` must still work.
7. **Legal accuracy is non-negotiable.** Never invent a law, section, helpline, authority or URL.
   Only these numbers may appear: `112 100 101 108 1076 1073 1091 1098 181 1930 1915 1033`.
8. **The disclaimer** is `border-warn/20 bg-warn/[0.06]`-free — use `<DisclaimerNote />`, which is now
   neutral. The shell footer already carries one persistent instance. Add an inline one only where it
   is load-bearing (scenario reveal, AI answer, emergency page). Do not add a full-width orange bar.
9. **Mobile 360px and desktop 1440px both work.** The shell already provides the sidebar (lg+) and
   bottom tab bar (<lg). Do not add another nav.
10. **Every control works.** No `href="#"`, no dead buttons, no placeholders, no lorem.
11. `npx vite build` must pass. Fix only errors in YOUR files.

## Reporting

Reply in under 100 words: files changed, build status, and anything you had to compromise on.
