import { motion } from 'framer-motion'
import { getHero } from '../game/heroes'
import { useGame } from '../store/gameStore'
import { HeroArt } from '../components/HeroArt'
import { Button, Label } from '../components/ui'

export function Versus() {
  const players = useGame((s) => s.players)
  const fight = useGame((s) => s.fight)
  const left = getHero(players[0].hero!)
  const right = getHero(players[1].hero!)

  return (
    <div className="relative flex h-full">
      <Half side="left" hero={left} seat="Player 1 · Left" />
      <Half side="right" hero={right} seat="Player 2 · Right" />

      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ scale: 3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 18 }}
      >
        <span className="rounded-xl border-4 border-paper bg-ink px-5 py-2 font-display text-6xl font-bold tracking-tighter shadow-[8px_8px_0_#f4f2ec]">
          VS
        </span>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 bottom-5 flex justify-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button className="h-14 w-56 text-lg tracking-[0.3em]" onClick={fight}>
          Fight
        </Button>
      </motion.div>
    </div>
  )
}

function Half({ side, hero, seat }: { side: 'left' | 'right'; hero: ReturnType<typeof getHero>; seat: string }) {
  const align = side === 'left' ? 'items-start text-left' : 'items-end text-right'
  return (
    <motion.div
      className="relative flex-1 overflow-hidden"
      initial={{ x: side === 'left' ? '-100%' : '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
    >
      <HeroArt hero={hero.id} className="absolute inset-0" dim />
      <div className={`relative flex h-full flex-col gap-1 p-6 pb-24 ${align}`}>
        <Label>{seat}</Label>
        <span className="font-display text-5xl font-bold uppercase leading-none">{hero.name}</span>
        <Label className="mt-1 text-paper/80">Faction {hero.faction}</Label>
        <span className="max-w-xs text-sm text-paper/90">{hero.playstyle.split('.')[0]}</span>
        <p className="mt-auto max-w-xs text-sm italic text-paper/80">“{hero.tagline}”</p>
      </div>
    </motion.div>
  )
}
