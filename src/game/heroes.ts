import type { HeroId } from './types'

export interface Hero {
  id: HeroId
  name: string
  faction: string
  /** Main colour, used as background when no art is present. */
  color: string
  /** Short playstyle line (picker, VS screen, end game). */
  playstyle: string
  /** One-line mood tagline. Original text, not from the cards. */
  tagline: string
}

export const HEROES: Hero[] = [
  {
    id: 'decima',
    name: 'Decima',
    faction: 'Homodeus',
    color: '#e3b341',
    playstyle: 'Economy & champion snowball. Big Gem turns, persistent Champions rule the board.',
    tagline: 'Flesh to metal, nerve to wire. Salvation, one body at a time.',
  },
  {
    id: 'kosynwu',
    name: 'Ko Syn Wu',
    faction: 'Wraethe',
    color: '#7a46c9',
    playstyle: 'Aggression & deck thinning. Heavy direct damage, banishes starter cards.',
    tagline: 'One foot in the void, one in the world, and a people torn between.',
  },
  {
    id: 'tetra',
    name: 'Tetra',
    faction: 'Order',
    color: '#2f7fd1',
    playstyle: 'Mastery acceleration & defense. Draws cards, gains Mastery fast, shields damage.',
    tagline: 'Built to serve the Ancients. She serves no one now.',
  },
  {
    id: 'volos',
    name: 'Volos',
    faction: 'Undergrowth',
    color: '#3f9a4a',
    playstyle: 'Sustain & Unify burst. Regenerates health, spikes when green cards combine.',
    tagline: 'A madman to his enemies. A god to his faithful.',
  },
  {
    id: 'rez',
    name: 'Rez',
    faction: 'Aion',
    color: '#d23a3a',
    playstyle: 'Flexibility & denial. Warps cards from the center row, uses them, then banishes them.',
    tagline: 'The future is unwritten. Rez intends to hold the pen.',
  },
]

export const RANDOM_COLOR = '#6b7280'

export function getHero(id: HeroId): Hero {
  const hero = HEROES.find((h) => h.id === id)
  if (!hero) throw new Error(`Unknown hero: ${id}`)
  return hero
}

/** Extensions accepted for local art files in /public/art (dev only, git-ignored). */
export const ART_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

export function artUrls(id: HeroId): string[] {
  return ART_EXTENSIONS.map((ext) => `/art/${id}.${ext}`)
}

/** Pick a random hero among those not in `taken`. */
export function randomHero(taken: Array<HeroId | null>, rng: () => number = Math.random): HeroId {
  const pool = HEROES.filter((h) => !taken.includes(h.id))
  return pool[Math.floor(rng() * pool.length)].id
}
