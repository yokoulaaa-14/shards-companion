import { getHero } from '../game/heroes'
import { MAX_MASTERY } from '../game/rules'
import type { PlayerState } from '../game/types'
import { HeroArt } from './HeroArt'
import { Label } from './ui'

/**
 * The player who is not playing. A dimmer layer covers the panel so it reads
 * as "not your turn", while Health and Mastery sit above it at full brightness.
 */
export function WaitingPanel({ player }: { player: PlayerState }) {
  const hero = getHero(player.hero!)
  const maxed = player.mastery >= MAX_MASTERY
  return (
    <div className="relative flex h-full flex-col gap-2 bg-panel-2 p-3">
      <div className="flex h-6 items-center">
        <span className="rounded border border-paper/40 px-2 py-0.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-paper/80">{hero.name}</span>
      </div>
      <HeroArt hero={hero.id} className="flex-1 rounded-lg" dim />

      {/* Dimmer: covers the name and the art, not the stats below. */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-ink/60" aria-hidden="true" />

      <div className="relative z-20 grid h-14 grid-cols-2 overflow-hidden rounded-lg border border-line bg-panel shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col items-center justify-center border-r border-line">
          <Label className="text-[9px]">Health</Label>
          <span className="font-display text-2xl font-bold leading-none tabular-nums">{player.health}</span>
        </div>
        <div className={`flex flex-col items-center justify-center ${maxed ? 'bg-paper text-ink' : ''}`}>
          <Label className={`text-[9px] ${maxed ? 'text-ink/70' : ''}`}>Mastery</Label>
          <span className="font-display text-2xl font-bold leading-none tabular-nums">{player.mastery}</span>
        </div>
      </div>
    </div>
  )
}
