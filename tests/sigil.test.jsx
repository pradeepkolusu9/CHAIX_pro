/**
 * Sigil rendering tests.
 *
 * The marks shipped as filled black shapes because the `fill`/`stroke` attributes
 * were spread onto the element *after* the explicit props, which React ignores.
 * These assert the actual rendered output so that class of bug cannot come back.
 */
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Sigil, sigilGlyph, MODULE_SIGILS, SIGIL_IDS, hasSigil } from '../src/components/ui/Sigil.jsx'

const html = (el) => renderToStaticMarkup(el)

describe('Sigil renders as a stroke, never a filled shape', () => {
  it('carries fill=none and stroke=currentColor', () => {
    const out = html(<Sigil id="consumer" />)
    expect(out).toContain('fill="none"')
    expect(out).toContain('stroke="currentColor"')
  })

  it('has round caps and joins so the set reads as one family', () => {
    const out = html(<Sigil id="cybercrime" />)
    expect(out).toContain('stroke-linecap="round"')
    expect(out).toContain('stroke-linejoin="round"')
  })

  it('uses a 24x24 viewBox on every mark', () => {
    for (const id of SIGIL_IDS) {
      expect(html(<Sigil id={id} />)).toContain('viewBox="0 0 24 24"')
    }
  })

  it('emits real path geometry for every registered mark', () => {
    for (const id of SIGIL_IDS) {
      const out = html(<Sigil id={id} />)
      expect(out, `${id} has no <path>`).toMatch(/<path d="M[^"]+"/)
      expect(out, `${id} is empty`).not.toContain('<svg viewBox="0 0 24 24" width="18" height="18" stroke-width="1.75" class="" role= aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></svg>')
    }
  })

  it('has no path data containing NaN or undefined', () => {
    for (const id of SIGIL_IDS) {
      const out = html(<Sigil id={id} />)
      expect(out).not.toMatch(/NaN|undefined/)
    }
  })
})

describe('Sigil sizing', () => {
  it('thins the stroke under 16px so small marks do not clog', () => {
    expect(html(<Sigil id="consumer" size={12} />)).toContain('stroke-width="1.6"')
  })
  it('uses 1.75 at 16px and above', () => {
    expect(html(<Sigil id="consumer" size={16} />)).toContain('stroke-width="1.75"')
    expect(html(<Sigil id="consumer" size={40} />)).toContain('stroke-width="1.75"')
  })
  it('honours a numeric size verbatim', () => {
    expect(html(<Sigil id="consumer" size={30} />)).toContain('width="30"')
  })
  it('resolves named sizes', () => {
    expect(html(<Sigil id="consumer" size="xs" />)).toContain('width="14"')
    expect(html(<Sigil id="consumer" size="2xl" />)).toContain('width="40"')
  })
})

describe('Sigil accessibility', () => {
  it('is decorative by default', () => {
    const out = html(<Sigil id="consumer" />)
    expect(out).toContain('aria-hidden="true"')
  })
  it('becomes an announced image when given a title', () => {
    const out = html(<Sigil id="consumer" title="Consumer Rights" />)
    expect(out).toContain('role="img"')
    expect(out).toContain('<title>Consumer Rights</title>')
  })
})

describe('Sigil colour comes only from the parent', () => {
  it('applies a text colour class to the svg', () => {
    expect(html(<Sigil id="consumer" className="text-xp-300" />)).toContain('text-xp-300')
  })
  it('never hardcodes a colour', () => {
    for (const id of SIGIL_IDS) {
      const out = html(<Sigil id={id} />)
      expect(out).not.toMatch(/#[0-9a-fA-F]{3,6}/)
      expect(out).not.toContain('rgb(')
    }
  })
})

describe('the registry', () => {
  it('has a mark for all 8 modules', () => {
    for (const id of ['cybercrime', 'consumer', 'road', 'student', 'workplace', 'privacy', 'safety', 'fundamental']) {
      expect(hasSigil(id), `missing ${id}`).toBe(true)
    }
  })

  it('aliases every module badge to a real mark', () => {
    for (const id of ['cyber-defender', 'smart-consumer', 'road-warrior', 'campus-guardian', 'workplace-rights', 'rights-protector']) {
      expect(hasSigil(id), `alias ${id} unresolved`).toBe(true)
    }
  })

  it('exposes a glyph adapter for every module', () => {
    for (const id of Object.keys(MODULE_SIGILS)) {
      expect(MODULE_SIGILS[id]).toBeTypeOf('function')
    }
  })

  it('sigilGlyph renders a mark, and ignores a caller strokeWidth', () => {
    const Glyph = sigilGlyph('consumer')
    const out = html(<Glyph size={20} strokeWidth={9} />)
    expect(out).toContain('<path')
    expect(out).not.toContain('stroke-width="9"')
  })

  it('returns null for an unknown id rather than rendering a broken box', () => {
    expect(html(<Sigil id="does-not-exist" />)).toBe('')
  })
})
