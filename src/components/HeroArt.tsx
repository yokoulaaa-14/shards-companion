import { artUrl, getHero } from '../game/heroes'
import type { HeroId } from '../game/types'

interface Props {
  hero: HeroId
  className?: string
  /** Darken the art so text on top stays readable. */
  dim?: boolean
}

/**
 * Hero colour block with the personal card photo on top when present in /public/art.
 * A missing file simply shows the colour.
 */
export function HeroArt({ hero, className = '', dim = false }: Props) {
  const h = getHero(hero)
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        backgroundColor: h.color,
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,${dim ? 0.35 : 0.1}) 0%, rgba(0,0,0,${dim ? 0.7 : 0.45}) 100%), url(${artUrl(hero)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
      aria-hidden="true"
    />
  )
}
