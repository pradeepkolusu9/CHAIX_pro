/** Colour identity per legal module. Feeds <IconBadge tone> / .tile-{tone}. Never reuse a tone for two modules. */
export const MODULE_TONE = {
  cybercrime: 'electric',
  consumer: 'xp',
  road: 'warn',
  student: 'violet',
  workplace: 'teal',
  privacy: 'pink',
  safety: 'good',
  fundamental: 'ink',
}

export const toneFor = (id) => MODULE_TONE[id] || 'electric'
