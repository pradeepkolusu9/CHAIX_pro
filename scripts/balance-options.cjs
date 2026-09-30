/**
 * Option-length balancing — the mechanical pass.
 *
 * A reviewer measured that in 24 of 40 scenarios the correct option was >=1.6x
 * longer than the average distractor (up to 2.9x), and that 37 of 40 correct
 * options were UNIQUELY the longest. The lesson a student actually learned was
 * "pick the longest line" — uncorrelated with knowing the law.
 *
 * The fix is mechanical and must hold across all 160 options, so it is a script
 * rather than an agent: it operates on the PARSED data, balances the four
 * options of every scenario, then re-serialises with Prettier-style formatting.
 * Shortening only, never padding — padding with filler is worse than the
 * original problem.
 *
 * `tests/option-fairness.test.js` is the spec. This script satisfies it.
 */
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'src', 'data', 'topics')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'))

const MAX = 92
const MIN = 24
const len = (s) => s.trim().length

/**
 * Reject a shortening that leaves a dangling function word or a trailing
 * conjunction — "…through the grievance committee and the" reads as a bug, not
 * a short option. Better to leave an option long than to mangle it.
 */
const DANGLING = /\b(and|or|the|a|an|to|of|for|in|on|with|then|that|which|but|its|their|your|it|this)$/i
function isGrammatical(t) {
  const s = t.trim()
  if (!s) return false
  if (DANGLING.test(s)) return false
  if (/[,;—-]$/.test(s)) return false
  // Must end on a word, not a fragment like "for the" or "in a".
  return /[a-z0-9%)\]]$/i.test(s)
}

/**
 * Shorten to fit `target`, but only accept the result if it still reads as a
 * complete action. Falls back through looser boundaries, then gives up — a
 * slightly long option is much better than a mangled one.
 */
function shorten(text, target) {
  const t = text.trim()
  if (len(t) <= target) return t
  const cut = t.slice(0, target)

  const candidates = []
  const dash = cut.lastIndexOf(' —')
  if (dash > target * 0.45) candidates.push(cut.slice(0, dash))
  const comma = cut.lastIndexOf(',')
  if (comma > target * 0.45) candidates.push(cut.slice(0, comma))
  const space = cut.lastIndexOf(' ')
  if (space > target * 0.4) candidates.push(cut.slice(0, space))
  candidates.push(cut)

  for (const c of candidates) {
    const out = c.replace(/[\s,;—-]+$/, '').trim()
    if (len(out) >= MIN && isGrammatical(out)) return out
  }
  return t
}

const report = []

for (const f of files) {
  const p = path.join(dir, f)
  const file = fs.readFileSync(p, 'utf8')

  // The file is a plain object literal; evaluating it is the only reliable way
  // to reach every scenario, including ones whose formatting has drifted.
  const data = new Function(`${file.replace(/^export default/, 'return')}`)()
  if (!data?.scenarios) continue

  let touched = 0

  for (const sc of data.scenarios) {
    const opts = sc.options
    const correct = opts.find((o) => o.id === sc.correct)
    const wrong = opts.filter((o) => o.id !== sc.correct)
    if (!correct || wrong.length < 2) continue

    // 1. hard cap
    for (const o of opts) {
      const n = shorten(o.text, MAX)
      if (n !== o.text.trim() && len(n) >= MIN) {
        o.text = n
        touched++
      }
    }

    // 2. iteratively shorten the longest until it is not a clear outlier, so no
    //    option is UNIQUEly the longest. This is the tell that had no exceptions.
    for (let pass = 0; pass < 5; pass += 1) {
      const sorted = [...opts].sort((a, b) => len(b.text) - len(a.text))
      const [longest, second] = sorted
      if (len(longest.text) - len(second.text) < 8) break
      if (len(longest.text) <= MIN + 4) break
      const n = shorten(longest.text, len(second.text))
      if (n === longest.text.trim() || len(n) < MIN) break
      longest.text = n
      touched++
    }

    // 3. also fix the mirror tell: a correct option that is uniquely the SHORTEST.
    //    Here we cannot shorten, so we bring the wrong options UP toward it.
    const lens = opts.map((o) => len(o.text))
    const minL = Math.min(...lens)
    const shortest = opts.find((o) => len(o.text) === minL)
    const others = opts.filter((o) => o !== shortest)
    if (others.every((o) => len(o.text) - minL >= 8)) {
      // Trim the others down toward the shortest, in steps, keeping the
      // grammatical result of `shorten`.
      for (const o of others) {
        const n = shorten(o.text, Math.max(MIN, minL + 10))
        if (n !== o.text.trim() && len(n) >= MIN) {
          o.text = n
          touched++
        }
      }
    }

    // 4. final band check on the correct option
    const meanWrong = wrong.reduce((a, o) => a + len(o.text), 0) / wrong.length
    const ratio = len(correct.text) / meanWrong
    if (ratio > 1.4 || ratio < 0.72) {
      const budget = Math.round(meanWrong * (ratio > 1.4 ? 1.25 : 1.05))
      const n = shorten(correct.text, Math.max(MIN, Math.min(budget, MAX)))
      if (n !== correct.text.trim() && len(n) >= MIN) {
        correct.text = n
        touched++
      }
    }
  }

  if (touched) {
    // Rewrite only the option text lines, preserving every comment and the rest
    // of the file byte-for-byte.
    let out = file
    for (const sc of data.scenarios) {
      for (const o of sc.options) {
        const esc = o.text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
        // Locate this scenario's options array, then this option's first line.
        const idx = out.indexOf(`id: '${sc.id}',`)
        if (idx === -1) continue
        const optIdx = out.indexOf(`{ id: '${o.id}', text: '`, idx)
        if (optIdx === -1) continue
        const end = out.indexOf("' }", optIdx)
        if (end === -1) continue
        out = out.slice(0, optIdx) + `{ id: '${o.id}', text: '${esc}` + out.slice(end)
      }
    }
    fs.writeFileSync(p, out)
    report.push(`${f}: ${touched} option(s) rebalanced`)
  }
}

console.log(report.length ? report.join('\n') : 'no changes needed')
