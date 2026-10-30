import { artUrl, getHero } from '../game/heroes'
import type { HeroId } from '../game/types'
import { usePhotos } from '../store/photoStore'

interface Props {
  hero: HeroId
  className?: string
  /** Darken the art so text on top stays readable. */
  dim?: boolean
}

/**
 * Hero colour block with a photo on top when one exists: first the photo
 * imported on this device, else a local file in /public/art during development.
 * A missing image simply shows the colour.
 */
export function HeroArt({ hero, className = '', dim = false }: Props) {
  const h = getHero(hero)
  const devicePhoto = usePhotos((s) => s.urls[hero])
  const src = devicePhoto ?? artUrl(hero)
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        backgroundColor: h.color,
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,${dim ? 0.35 : 0.1}) 0%, rgba(0,0,0,${dim ? 0.7 : 0.45}) 100%), url("${src}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
      aria-hidden="true"
    />
  )
}
