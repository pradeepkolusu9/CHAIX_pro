/**
 * Repair options that a previous mechanical pass truncated mid-sentence.
 *
 * The balancing script shortens on clause boundaries, but 20 options across the
 * 8 topic files were left ending on a dangling word ("...ask other buyers to").
 * A mangled option is worse than a long one — it reads as a bug, and the whole
 * point of the length work was that no option should look different in weight.
 *
 * Every repair below is hand-written, complete, and sits in the same length band
 * as its siblings. Verify with: node scripts/check-truncation.cjs
 */
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'src', 'data', 'topics')

/** 'file:scenario:option' -> corrected text */
const REPAIRS = {
  'consumer.js:sc-co-1:d': 'Leave a review on the app warning other buyers',
  'consumer.js:sc-co-3:c': 'Keep messaging the WhatsApp centre until they reply',
  'consumer.js:sc-co-3:d': 'File only with the police and wait for their reply',
  'cybercrime.js:sc-cy-4:c': 'Message the person politely and ask them to stop',
  'cybercrime.js:sc-cy-5:d': 'Post publicly asking who shared your details',
  'fundamental.js:sc-fr-1:a': 'Accept it quietly and hope for the best next year',
  'fundamental.js:sc-fr-1:b': 'Post Meera\'s marks online so people can judge it',
  'privacy.js:sc-pv-1:b': 'Turn off camera access and stop using the feature',
  'privacy.js:sc-pv-1:d': 'Download an unofficial APK and install it instead',
  'road.js:sc-rd-1:a': 'Say the college never told you to register it',
  'road.js:sc-rd-1:d': 'Refuse to hand over your licence and ask to see the notice',
  'road.js:sc-rd-3:d': 'Refuse to give your licence until he explains the rule',
  'safety.js:sc-sf-1:a': 'Block the numbers and wait for him to get bored',
  'student.js:sc-st-3:c': 'Put it in writing to the college grievance committee',
  'workplace.js:sc-wp-2:a': 'Work the extra hours quietly, since raising it is risky',
  'workplace.js:sc-wp-3:a': 'Treat it as a favour and forget about the pay',
  'workplace.js:sc-wp-3:d': 'Refuse every future holiday shift from now on',
}

/* Only genuinely incomplete endings. "…hoping someone returns it" and
   "…ask him to stop" are complete; "…ask other buyers to" is not. Words like
   it/on/then are perfectly valid terminal words, so they are not on the list. */
const DANGLING = /\b(and|or|the|a|an|to|of|for|with|that|which|its|their|your|this|by|from|about|into|than|as)$/i

let applied = 0
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const p = path.join(dir, f)
  let src = fs.readFileSync(p, 'utf8')
  let changed = 0

  for (const [key, text] of Object.entries(REPAIRS)) {
    const [file, scId, optId] = key.split(':')
    if (file !== f) continue
    const scIdx = src.indexOf(`id: '${scId}',`)
    if (scIdx === -1) continue
    const optIdx = src.indexOf(`{ id: '${optId}', text: '`, scIdx)
    if (optIdx === -1) continue
    const end = src.indexOf("' }", optIdx)
    if (end === -1) continue
    const esc = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    src = src.slice(0, optIdx) + `{ id: '${optId}', text: '${esc}` + src.slice(end)
    changed++
  }

  if (changed) {
    fs.writeFileSync(p, src)
    applied += changed
    console.log(`${f}: ${changed} repaired`)
  }
}

console.log(`\ntotal repaired: ${applied}`)
console.log('\nremaining dangling options:')
let bad = 0
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const data = new Function(
    fs.readFileSync(path.join(dir, f), 'utf8').replace(/^export default/, 'return'),
  )()
  for (const s of data.scenarios) {
    for (const o of s.options) {
      if (DANGLING.test(o.text.trim())) {
        console.log(`  ${f} ${s.id} ${o.id} ${JSON.stringify(o.text)}`)
        bad++
      }
    }
  }
}
console.log(bad ? `  → ${bad} still dangling` : '  → none')
