/**
 * Mock leaderboard data for the prototype.
 * `xp` values are seeds; the current user's real XP is injected at render time
 * and sorted in, so the row always reflects actual play.
 */

export const COLLEGES = [
  'VIT Chennai',
  'SRM University',
  'Amity Noida',
  'BITS Pilani',
  'Manipal University',
  'Jio Institute',
  'KIIT Bhubaneswar',
  'NIT Trichy',
]

const people = [
  { id: 'p1', name: 'Aarav Mehta', college: 'VIT Chennai', weekly: 3420, global: 21450, badges: 11 },
  { id: 'p2', name: 'Riya Sharma', college: 'BITS Pilani', weekly: 3180, global: 20980, badges: 10 },
  { id: 'p3', name: 'Rahul Nair', college: 'SRM University', weekly: 2950, global: 19840, badges: 10 },
  { id: 'p4', name: 'Ananya Iyer', college: 'VIT Chennai', weekly: 2740, global: 19210, badges: 9 },
  { id: 'p5', name: 'Karthik Raj', college: 'NIT Trichy', weekly: 2610, global: 18760, badges: 9 },
  { id: 'p6', name: 'Sneha Pillai', college: 'Amity Noida', weekly: 2480, global: 18120, badges: 8 },
  { id: 'p7', name: 'Vikram Singh', college: 'Manipal University', weekly: 2360, global: 17540, badges: 8 },
  { id: 'p8', name: 'Meera Joshi', college: 'VIT Chennai', weekly: 2240, global: 16980, badges: 8 },
  { id: 'p9', name: 'Aditya Bose', college: 'KIIT Bhubaneswar', weekly: 2110, global: 16310, badges: 7 },
  { id: 'p10', name: 'Fatima Khan', college: 'Jio Institute', weekly: 1980, global: 15770, badges: 7 },
  { id: 'p11', name: 'Rohan Das', college: 'SRM University', weekly: 1870, global: 15240, badges: 7 },
  { id: 'p12', name: 'Priya Menon', college: 'BITS Pilani', weekly: 1740, global: 14610, badges: 6 },
  { id: 'p13', name: 'Siddharth Roy', college: 'NIT Trichy', weekly: 1620, global: 14080, badges: 6 },
  { id: 'p14', name: 'Nandini Rao', college: 'Amity Noida', weekly: 1490, global: 13420, badges: 6 },
  { id: 'p15', name: 'Arjun Verma', college: 'Manipal University', weekly: 1360, global: 12910, badges: 5 },
  { id: 'p16', name: 'Ishita Sen', college: 'Jio Institute', weekly: 1210, global: 12240, badges: 5 },
  { id: 'p17', name: 'Naveen Kumar', college: 'VIT Chennai', weekly: 1080, global: 11690, badges: 4 },
  { id: 'p18', name: 'Tanvi Shah', college: 'KIIT Bhubaneswar', weekly: 940, global: 11020, badges: 4 },
  { id: 'p19', name: 'Dev Patel', college: 'SRM University', weekly: 810, global: 10480, badges: 4 },
  { id: 'p20', name: 'Kavya Reddy', college: 'BITS Pilani', weekly: 660, global: 9830, badges: 3 },
]

export const ALL_PEOPLE = people

/** Fixed 'you' row; XP is replaced with the live value at render time. */
export const YOU = { id: 'you', name: 'You', college: 'VIT Chennai' }

export const TABS = [
  { key: 'weekly', label: 'This Week', hint: 'Resets every Monday' },
  { key: 'college', label: 'My College', hint: 'Your institution' },
  { key: 'global', label: 'All India', hint: 'Everyone on LawLink' },
]

/** Sort a board and return top rows plus the real rank of the current user. */
export function buildBoard(tab, { xp = 0, college = 'VIT Chennai', name = 'You' } = {}) {
  const valueFor = (p) => (tab === 'global' ? p.global : p.weekly)
  const you = { ...YOU, name: name || 'You', college: college || YOU.college, xp }

  let pool = tab === 'college' ? people.filter((p) => p.college === college) : people
  if (tab === 'college' && pool.length < 3) {
    pool = [...pool, ...people.filter((p) => p.college !== college).slice(0, 3 - pool.length)]
  }

  const rows = [
    ...pool.map((p) => ({ ...p, xp: valueFor(p), isYou: false })),
    { ...you, xp, isYou: true },
  ].sort((a, b) => b.xp - a.xp)

  rows.forEach((r, i) => {
    r.rank = i + 1
  })

  return {
    rows,
    top: rows.slice(0, 3),
    you: rows.find((r) => r.isYou),
    total: rows.length,
  }
}

export const podiumClass = (rank) =>
  rank === 1
    ? 'from-xp-300 to-xp-500 text-ink-900'
    : rank === 2
      ? 'from-slate-200 to-slate-400 text-ink-900'
      : rank === 3
        ? 'from-amber-700 to-amber-500 text-white'
        : ''
