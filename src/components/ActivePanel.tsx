import { getHero } from '../game/heroes'
import { canBuyMastery, MAX_HEALTH, MAX_MASTERY } from '../game/rules'
import type { PlayerState } from '../game/types'
import { useGame, type PlayerIndex } from '../store/gameStore'
import { CardFooter, Counter } from './Counter'
import { HeroArt } from './HeroArt'
import { MasteryBar } from './MasteryBar'
import { Button, Label } from './ui'

interface Props {
  index: PlayerIndex
  player: PlayerState
}

export function ActivePanel({ index, player }: Props) {
  const hero = getHero(player.hero!)
  const pending = useGame((s) => s.pending)
  const tap = useGame((s) => s.tap)
  const undo = useGame((s) => s.undo)
  const buy = useGame((s) => s.buyMastery)
  const undoBuy = useGame((s) => s.undoBuyMastery)
  const toggleInfinity = useGame((s) => s.toggleInfinity)
  const openAttack = useGame((s) => s.openAttack)

  const pendingFor = (resource: PlayerState['undo'] extends Partial<Record<infer R, number>> ? R : never) =>
    pending && pending.player === index && pending.resource === resource ? pending.delta : undefined

  const side = index === 0 ? 'left' : 'right'
  const buyBlocked = !canBuyMastery(player) && !player.boughtMasteryThisTurn
  const buyBlockedLabel = player.mastery >= MAX_MASTERY ? 'Mastery is maxed' : 'Focus : need 1 gem'

  return (
    <div
      className={`flex h-full gap-3 p-3 ${side === 'right' ? 'flex-row-reverse' : ''}`}
      style={{ backgroundColor: `color-mix(in srgb, ${hero.color} 14%, var(--color-ink))` }}
    >
      {/* Hero column */}
      <div className="flex w-[31%] min-w-[180px] flex-col gap-2">
        <div className="flex h-6 items-center gap-2">
          <span className="rounded border border-paper/60 px-2 py-0.5 font-display text-xs font-bold uppercase tracking-[0.18em]">{hero.name}</span>
          <span className="rounded bg-paper px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-ink">Your turn</span>
        </div>
        <HeroArt hero={hero.id} className="flex-1 rounded-lg" />
        <Button className="h-14 text-base" onClick={openAttack} style={{ backgroundColor: hero.color, color: '#0b0b0d' }}>
          {player.powerInfinite ? (
            <span className="flex flex-col leading-tight">
              <span>End turn</span>
              <span className="text-[9px] tracking-[0.2em] opacity-80">wins the game</span>
            </span>
          ) : (
            'End turn'
          )}
        </Button>
      </div>

      {/* 2×2 grid */}
      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2.5">
        <Counter
          label="Health"
          hint={`/ ${MAX_HEALTH}`}
          value={player.health}
          current={player.health}
          max={MAX_HEALTH}
          pending={pendingFor('health')}
          undoAmount={player.undo.health}
          onTap={(d) => tap('health', d)}
          onUndo={() => undo('health')}
        />

        <Counter
          label="Mastery"
          hint={`/ ${MAX_MASTERY}`}
          value={
            <span className={player.mastery >= MAX_MASTERY ? 'rounded bg-paper px-2 text-ink' : ''}>{player.mastery}</span>
          }
          current={player.mastery}
          max={MAX_MASTERY}
          pending={pendingFor('mastery')}
          undoAmount={player.undo.mastery}
          onTap={(d) => tap('mastery', d)}
          onUndo={() => undo('mastery')}
          footer={<MasteryBar mastery={player.mastery} />}
        />

        <Counter
          label="Gems"
          hint="· this turn"
          value={player.gems}
          current={player.gems}
          pending={pendingFor('gems')}
          undoAmount={player.undo.gems}
          onTap={(d) => tap('gems', d)}
          onUndo={() => undo('gems')}
          footer={
            player.boughtMasteryThisTurn ? (
              <div className="flex gap-1.5">
                <Button variant="secondary" className="h-8 flex-1 basis-0 whitespace-nowrap text-[11px]" disabled aria-label="Focus used this turn">
                  ✓ Focus
                </Button>
                {player.buyUndoable && (
                  <Button variant="secondary" className="h-8 flex-1 basis-0 text-[11px]" onClick={undoBuy} aria-label="Undo focus">
                    ↶ Undo
                  </Button>
                )}
              </div>
            ) : buyBlocked ? (
              <Button variant="secondary" className="h-8 text-[11px]" disabled>
                {buyBlockedLabel}
              </Button>
            ) : (
              <Button variant="secondary" className="h-8 text-[11px]" onClick={buy}>
                Focus : −1 gem, +1 mastery
              </Button>
            )
          }
        />

        {player.powerInfinite ? (
          <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-panel/70 p-2.5">
            <div className="flex h-5 items-center">
              <Label>Power</Label>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="rounded-md bg-paper px-4 font-display text-5xl font-bold leading-none text-ink">∞</span>
            </div>
            <CardFooter>
              <Button variant="secondary" className="h-8 text-[11px]" onClick={toggleInfinity}>
                ↶ Cancel infinity
              </Button>
            </CardFooter>
          </div>
        ) : (
          <Counter
            label="Power"
            hint="· this turn"
            value={player.power}
            current={player.power}
            pending={pendingFor('power')}
            undoAmount={player.undo.power}
            onTap={(d) => tap('power', d)}
            onUndo={() => undo('power')}
            footer={
              <Button variant="secondary" className="h-8 text-[11px]" onClick={toggleInfinity}>
                ∞ Infinity Shard
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
