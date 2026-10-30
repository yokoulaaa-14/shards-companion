import { artUrls, getHero } from '../game/heroes'
import type { HeroId } from '../game/types'
import { usePhotos } from '../store/photoStore'

interface Props {
  hero: HeroId
  className?: string
  /** Darken the art so text on top stays readable. */
  dim?: boolean
}

/**
 * Hero colour block with a picture on top when one exists: first the photo
 * imported on this device, else a local file in /public/art during development
 * (any of jpg, jpeg, png, webp; missing ones simply don't paint).
 * With no image at all, the hero colour shows.
 */
export function HeroArt({ hero, className = '', dim = false }: Props) {
  const h = getHero(hero)
  const devicePhoto = usePhotos((s) => s.urls[hero])
  // Local /public/art files exist only on the developer's machine (git-ignored),
  // so the deployed site skips them and relies on device photos.
  const images = devicePhoto ? [devicePhoto] : import.meta.env.DEV ? artUrls(hero) : []
  const shade = `linear-gradient(180deg, rgba(0,0,0,${dim ? 0.35 : 0.1}) 0%, rgba(0,0,0,${dim ? 0.7 : 0.45}) 100%)`
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        backgroundColor: h.color,
        backgroundImage: [shade, ...images.map((u) => `url("${u}")`)].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
      aria-hidden="true"
    />
  )
}
