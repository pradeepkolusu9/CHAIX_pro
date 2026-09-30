/**
 * Diagnose the residual option-length outliers after balancing.
 * Read-only: prints the measurements, changes nothing.
 */
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'src', 'data', 'topics')
const len = (s) => s.trim().length
const rows = []

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const file = fs.readFileSync(path.join(dir, f), 'utf8')
  const data = new Function(`${file.replace(/^export default/, 'return')}`)()
  for (const sc of data.scenarios) {
    const c = sc.options.find((o) => o.id === sc.correct)
    const lens = sc.options.map((o) => len(o.text))
    const correctLen = len(c.text)
    rows.push({
      id: sc.id,
      file: f,
      correctLen,
      lens: lens.join('/'),
      correctText: c.text,
      isUniqueLongest: correctLen === Math.max(...lens),
      isUniqueShortest: correctLen === Math.min(...lens),
      margin: Math.abs(correctLen - lens.filter((l) => l !== correctLen).reduce((a, b) => Math.min(a, b), 999)),
    })
  }
}

const bad = rows.filter((r) => r.isUniqueLongest || r.isUniqueShortest)
console.log(`total ${rows.length}, still outliers ${bad.length}\n`)
for (const r of bad) {
  console.log(
    `${r.id}  lens=${r.lens}  correct="${r.correctText}"  ` +
      `${r.isUniqueLongest ? 'UNIQUE LONGEST' : 'UNIQUE SHORTEST'}`,
  )
}
