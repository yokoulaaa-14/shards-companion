import { useState } from 'react'
import { motion } from 'framer-motion'
import { getHero, type Hero } from '../game/heroes'
import { MAX_HEALTH } from '../game/rules'
import { healthTimeline, summarize, type PlayerSummary, type TurnRecord } from '../game/stats'
import { formatDuration } from '../game/timer'
import type { PlayerState } from '../game/types'
import { Button, Label } from './ui'

interface Props {
  players: [PlayerState, PlayerState]
  log: TurnRecord[]
  gameMs: number
  rounds: number
  winner: 0 | 1
  onBack: () => void
  onHome: () => void
}

/** Which value is better: 'high', 'low', or 'none' (no bold, e.g. durations that are neither good nor bad). */
type Better = 'high' | 'low' | 'none'
type Row = { label: string; get: (s: PlayerSummary) => number; format?: (n: number, s: PlayerSummary) => string; better?: Better }

const decimal = (n: number) => n.toFixed(1)

type Tab = 'totals' | 'best' | 'averages'

const TABS: Array<{ id: Tab; label: string; rows: Row[] }> = [
  {
    id: 'totals',
    label: 'Totals',
    rows: [
      { label: 'Power generated', get: (s) => s.powerGenerated },
      { label: 'Damage dealt', get: (s) => s.damageDealt },
      { label: 'Power on champions', get: (s) => s.onChampions },
      { label: 'Blocked by shields', get: (s) => s.shieldsBlocked },
      { label: 'Gems gained', get: (s) => s.gemsGained },
      { label: 'Mastery gained', get: (s) => s.masteryGained },
      { label: 'Health healed', get: (s) => s.healed },
      { label: 'Focus used', get: (s) => s.focusUsed, format: (n, s) => `${n} / ${s.turns}` },
    ],
  },
  {
    id: 'best',
    label: 'Best turn',
    rows: [
      { label: 'Most Power', get: (s) => s.mostPower },
      { label: 'Biggest hit', get: (s) => s.biggestHit },
      { label: 'Most Gems', get: (s) => s.mostGems },
      { label: 'Most Mastery', get: (s) => s.mostMastery },
      { label: 'Most healing', get: (s) => s.mostHealing },
      { label: 'Longest turn', get: (s) => s.longestTurnMs, format: formatDuration, better: 'none' },
      { label: 'Fastest turn', get: (s) => s.fastestTurnMs, format: formatDuration, better: 'low' },
    ],
  },
  {
    id: 'averages',
    label: 'Averages',
    rows: [
      { label: 'Avg Power', get: (s) => s.avgPower, format: decimal },
      { label: 'Avg damage', get: (s) => s.avgDamage, format: decimal },
      { label: 'Avg Gems', get: (s) => s.avgGems, format: decimal },
      { label: 'Avg turn time', get: (s) => s.avgTurnMs, format: formatDuration, better: 'none' },
    ],
  },
]

function betterSeat(a: number, b: number, better: Better, summaries: readonly [PlayerSummary, PlayerSummary]): -1 | 0 | 1 {
  if (better === 'none' || a === b) return -1
  // A player with no turns has nothing to compare on "lowest" rows.
  if (better === 'low') {
    if (summaries[0].turns === 0 || summaries[1].turns === 0) return -1
    return a < b ? 0 : 1
  }
  return a > b ? 0 : 1
}

/** Full-screen recap of the finished game: health over time and a tabbed side-by-side comparison. */
export function StatsScreen({ players, log, gameMs, rounds, winner, onBack, onHome }: Props) {
  const [tab, setTab] = useState<Tab>('totals')
  const heroes = [getHero(players[0].hero!), getHero(players[1].hero!)] as const
  const summaries = [summarize(log, 0), summarize(log, 1)] as const
  const byInfinity = log.at(-1)?.infinite ?? false
  const loser = winner === 0 ? 1 : 0
  const current = TABS.find((t) => t.id === tab)!
  const few = current.rows.length <= 4

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col gap-3 bg-ink p-4 text-paper"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="flex items-center gap-4">
        <div className="flex flex-1 flex-col">
          <h1 className="font-display text-2xl font-bold leading-none">Game stats</h1>
          <span className="mt-1 text-xs text-muted">
            {heroes[winner].name} won · {byInfinity ? 'Infinity Shard unleashed' : `${heroes[loser].name} down to 0 health`} · {formatDuration(gameMs)} · {rounds} rounds · {log.length} turns
          </span>
        </div>
        <Button variant="secondary" className="h-10 w-28" onClick={onBack}>
          Back
        </Button>
        <Button className="h-10 w-40" onClick={onHome}>
          Back to home
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <section className="flex min-h-0 flex-col gap-2 rounded-lg border border-line bg-panel p-3">
          <div className="flex items-center justify-between">
            <Label>Health over the game</Label>
            <div className="flex gap-3">
              {heroes.map((h) => (
                <span key={h.id} className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: h.color }} />
                  {h.name}
                </span>
              ))}
            </div>
          </div>
          <HealthChart log={log} heroes={heroes} />
        </section>

        <section className="flex min-h-0 flex-col gap-2 rounded-lg border border-line bg-panel px-3 py-2">
          <div role="tablist" aria-label="Stats" className="grid grid-cols-3 gap-1 rounded-md border border-line p-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tab}
                onClick={() => setTab(t.id)}
                className={`h-8 rounded font-display text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                  t.id === tab ? 'bg-paper text-ink' : 'text-paper/70 active:bg-paper/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 border-b border-line pb-1.5">
            <span className="truncate font-display text-xs font-bold uppercase tracking-wider" style={{ color: heroes[0].color }}>
              {heroes[0].name}
            </span>
            <span />
            <span className="truncate text-right font-display text-xs font-bold uppercase tracking-wider" style={{ color: heroes[1].color }}>
              {heroes[1].name}
            </span>
          </div>
          <div role="tabpanel" className="flex min-h-0 flex-1 flex-col justify-around">
            {current.rows.map((row) => {
              const a = row.get(summaries[0])
              const b = row.get(summaries[1])
              const fmt = (n: number, seat: 0 | 1) => (row.format ? row.format(n, summaries[seat]) : String(n))
              const better = betterSeat(a, b, row.better ?? 'high', summaries)
              return (
                <div key={row.label} className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 leading-tight ${few ? 'text-xl' : 'text-sm'}`}>
                  <span className={`tabular-nums ${better === 0 ? 'font-bold text-paper' : 'text-paper/70'}`}>{fmt(a, 0)}</span>
                  <span className="text-center font-display text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{row.label}</span>
                  <span className={`text-right tabular-nums ${better === 1 ? 'font-bold text-paper' : 'text-paper/70'}`}>{fmt(b, 1)}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </motion.div>
  )
}

function HealthChart({ log, heroes }: { log: TurnRecord[]; heroes: readonly [Hero, Hero] }) {
  const points = healthTimeline(log)
  const W = 360
  const H = 200
  const pad = { l: 22, r: 8, t: 6, b: 18 }
  const n = Math.max(1, points.length - 1)
  const x = (i: number) => pad.l + (i / n) * (W - pad.l - pad.r)
  const y = (hp: number) => pad.t + (1 - hp / MAX_HEALTH) * (H - pad.t - pad.b)
  const line = (seat: 0 | 1) => points.map((p, i) => `${x(i).toFixed(1)},${y(p[seat]).toFixed(1)}`).join(' ')

  if (log.length === 0) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted">No turns were played.</div>
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="min-h-0 w-full flex-1" preserveAspectRatio="none" role="img" aria-label="Health of both players after each turn">
      {[0, 25, 50].map((hp) => (
        <g key={hp}>
          <line x1={pad.l} x2={W - pad.r} y1={y(hp)} y2={y(hp)} stroke="var(--color-line)" strokeWidth="1" />
          <text x={pad.l - 6} y={y(hp) + 3} textAnchor="end" fontSize="9" fill="var(--color-muted)">
            {hp}
          </text>
        </g>
      ))}
      <text x={W - pad.r} y={H - 4} textAnchor="end" fontSize="9" fill="var(--color-muted)">
        turns →
      </text>
      {([0, 1] as const).map((seat) => (
        <polyline
          key={seat}
          points={line(seat)}
          fill="none"
          stroke={heroes[seat].color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
