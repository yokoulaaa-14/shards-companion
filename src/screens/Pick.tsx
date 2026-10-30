import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HEROES, RANDOM_COLOR, getHero } from '../game/heroes'
import type { HeroId } from '../game/types'
import { useGame } from '../store/gameStore'
import { HeroArt } from '../components/HeroArt'
import { Button, Label } from '../components/ui'

type Choice = HeroId | 'random'

export function Pick() {
  const pickStep = useGame((s) => s.pickStep)
  const players = useGame((s) => s.players)
  const pickHero = useGame((s) => s.pickHero)
  const [choice, setChoice] = useState<Choice | null>(null)
  // A new picker step starts with nothing selected.
  useEffect(() => setChoice(null), [pickStep])

  const taken = players[0].hero
  const isSecond = pickStep === 1
  const selectedHero = choice && choice !== 'random' ? getHero(choice) : null

  return (
    <div className="flex h-full flex-col gap-3 px-6 py-4">
      <header className="flex flex-col">
        <h1 className="font-display text-2xl font-bold">Player {pickStep + 1} · pick your Shard Master</h1>
        <p className="text-sm text-muted">
          {isSecond ? 'You sit on the right and play second with a mastery advantage' : 'You sit on the left and start the game'}
        </p>
      </header>

      <div className="flex flex-1 items-center justify-center gap-3">
        {HEROES.map((h) => {
          const isTaken = h.id === taken
          const selected = choice === h.id
          return (
            <Card
              key={h.id}
              selected={selected}
              disabled={isTaken}
              onClick={() => !isTaken && setChoice(h.id)}
              color={h.color}
            >
              <HeroArt hero={h.id} className="absolute inset-0" dim />
              <div className="relative mt-auto flex flex-col items-center gap-0.5 px-1 pb-2 text-center">
                {isTaken && <Label className="text-[8px] text-paper/70">Player 1 chose</Label>}
                <span className="font-display text-sm font-bold uppercase tracking-wider">{h.name}</span>
              </div>
            </Card>
          )
        })}
        <Card selected={choice === 'random'} onClick={() => setChoice('random')} color={RANDOM_COLOR} dashed>
          <div className="relative mt-auto flex flex-col items-center pb-2">
            <span className="font-display text-4xl font-bold text-paper/60">?</span>
            <span className="font-display text-sm font-bold uppercase tracking-wider">Random</span>
          </div>
        </Card>
      </div>

      <footer className="flex h-14 items-center gap-4">
        <div className="flex min-h-10 flex-1 flex-col justify-center border-l-4 pl-3" style={{ borderColor: selectedHero?.color ?? RANDOM_COLOR }}>
          {selectedHero ? (
            <>
              <Label>Faction {selectedHero.faction}</Label>
              <span className="text-sm font-medium">{selectedHero.playstyle}</span>
            </>
          ) : choice === 'random' ? (
            <span className="text-sm text-muted">Revealed on the next screen.</span>
          ) : (
            <span className="text-sm text-muted">Tap a card to select.</span>
          )}
        </div>
        <Button className="h-12 w-56" disabled={!choice} onClick={() => choice && pickHero(choice)}>
          {choice ? `Confirm ${choice === 'random' ? 'random' : getHero(choice).name}` : 'Confirm'}
        </Button>
      </footer>
    </div>
  )
}

function Card({
  children,
  selected,
  disabled,
  onClick,
  color,
  dashed,
}: {
  children: React.ReactNode
  selected: boolean
  disabled?: boolean
  onClick: () => void
  color: string
  dashed?: boolean
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      animate={{ scale: selected ? 1.12 : 1, opacity: disabled ? 0.35 : 1 }}
      whileTap={disabled ? undefined : { scale: selected ? 1.08 : 0.96 }}
      className={`relative flex h-44 w-28 flex-col overflow-hidden rounded-xl border-2 bg-panel-2 ${dashed ? 'border-dashed' : ''}`}
      style={{ borderColor: selected ? color : 'var(--color-line)', boxShadow: selected ? `0 0 0 3px ${color}55, 0 12px 30px rgba(0,0,0,0.5)` : undefined }}
    >
      {children}
    </motion.button>
  )
}
