import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getHero } from '../game/heroes'
import { averageTurnMs, elapsedAt, formatDuration } from '../game/timer'
import { opponentOf, useGame } from '../store/gameStore'
import { HeroArt } from '../components/HeroArt'
import { Button, Label } from '../components/ui'

/**
 * Starts from the VS layout, then: the winner's half strikes the loser's half,
 * the loser fades out, and the winner settles at the centre on their own colour.
 */
export function EndGame() {
  const finishGame = useGame((s) => s.finishGame)
  // Snapshot the result on mount: the store is reset by "Restart" while this
  // screen is still fading out, and it must keep rendering the finished game.
  const snapshot = useRef(useGame.getState()).current
  const winner = snapshot.winner
  const [stage, setStage] = useState<'strike' | 'winner'>('strike')

  useEffect(() => {
    const t = setTimeout(() => setStage('winner'), 1400)
    return () => clearTimeout(t)
  }, [])

  if (winner === null) return null
  const loser = opponentOf(winner)
  const winHero = getHero(snapshot.players[winner].hero!)
  const loseHero = getHero(snapshot.players[loser].hero!)
  const gameMs = elapsedAt(snapshot.timer, Date.now())
  const stats = {
    time: formatDuration(gameMs),
    turns: snapshot.turn,
    avgTurn: formatDuration(averageTurnMs(gameMs, snapshot.turn)),
    // A win by Infinity Shard leaves the opponent with health left.
    byInfinity: snapshot.players[loser].health > 0,
  }
  return <EndGameView winner={winner} winHero={winHero} loseHero={loseHero} stats={stats} stage={stage} onRestart={finishGame} />
}

function EndGameView({
  winner,
  winHero,
  loseHero,
  stats,
  stage,
  onRestart,
}: {
  winner: 0 | 1
  winHero: ReturnType<typeof getHero>
  loseHero: ReturnType<typeof getHero>
  stats: { time: string; turns: number; avgTurn: string; byInfinity: boolean }
  stage: 'strike' | 'winner'
  onRestart: () => void
}) {

  const winnerSide = winner === 0 ? 'left' : 'right'
  const strikeX = winnerSide === 'left' ? 140 : -140

  return (
    <div className="relative h-full overflow-hidden" style={{ backgroundColor: stage === 'winner' ? winHero.color : 'var(--color-ink)', transition: 'background-color 600ms' }}>
      <AnimatePresence>
        {stage === 'strike' && (
          <div key="strike" className={`absolute inset-0 flex ${winnerSide === 'left' ? '' : 'flex-row-reverse'}`}>
            <motion.div
              className="relative flex-1"
              initial={{ x: 0, skewX: 0 }}
              animate={{ x: [0, -40, strikeX, strikeX * 0.6], skewX: [0, -3, 4, 0] }}
              transition={{ duration: 0.9, times: [0, 0.3, 0.6, 1], ease: 'easeInOut' }}
            >
              <HeroArt hero={winHero.id} className="absolute inset-0" />
              <div className={`absolute bottom-6 ${winnerSide === 'left' ? 'left-6' : 'right-6 text-right'}`}>
                <Label>Winner</Label>
                <div className="font-display text-5xl font-bold uppercase">{winHero.name}</div>
              </div>
            </motion.div>
            <motion.div
              className="relative flex-1"
              initial={{ x: 0, opacity: 1, rotate: 0 }}
              animate={{ x: -strikeX * 1.5, opacity: 0, rotate: winnerSide === 'left' ? 8 : -8 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeIn' }}
            >
              <HeroArt hero={loseHero.id} className="absolute inset-0" dim />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <span className="rotate-12 rounded-xl border-4 border-paper bg-ink px-6 py-3 font-display text-5xl font-bold shadow-[6px_6px_0_#f4f2ec]">HIT</span>
            </motion.div>
          </div>
        )}

        {stage === 'winner' && (
          <motion.div
            key="winner"
            className="absolute inset-0 flex items-center justify-center gap-8 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-64 w-44 overflow-hidden rounded-2xl border-4 border-ink shadow-[12px_12px_0_#0b0b0d]"
              initial={{ scale: 0.8, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            >
              <HeroArt hero={winHero.id} className="h-full w-full" />
            </motion.div>
            <div className="flex w-80 flex-col gap-2 text-ink">
              <span className="font-display text-xs font-bold uppercase tracking-[0.3em] text-ink/70">Victory</span>
              <h1 className="font-display text-4xl font-bold leading-none">{winHero.name} wins</h1>
              <p className="text-sm text-ink/80">
                Player {winner + 1} · {stats.byInfinity ? 'Infinity Shard unleashed' : `${loseHero.name} is down to 0 health`}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Game time" value={stats.time} />
                <Stat label="Turns" value={String(stats.turns)} />
                <Stat label="Avg turn" value={stats.avgTurn} />
              </div>
              <div className="mt-1 border-l-4 border-ink pl-3">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-ink/70">Faction {winHero.faction}</span>
                <p className="text-sm font-medium">{winHero.playstyle.split('.')[0]}</p>
              </div>
              <p className="text-sm italic text-ink/80">“{winHero.tagline}”</p>
              <Button className="mt-2 h-13" style={{ backgroundColor: '#0b0b0d', color: '#f4f2ec' }} onClick={onRestart}>
                Restart a new game
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-ink/85 px-2.5 py-1.5 text-paper">
      <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-paper/60">{label}</span>
      <span className="font-display text-xl font-bold leading-none tabular-nums">{value}</span>
    </div>
  )
}
