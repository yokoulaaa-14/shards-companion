import { MAX_HEALTH } from './rules'

export type Seat = 0 | 1

/** What happened during one player's turn, recorded when the turn ends. */
export interface TurnRecord {
  player: Seat
  durationMs: number
  /** Power available when ending the turn (0 when the turn passed without attacking). */
  power: number
  infinite: boolean
  onChampions: number
  /** Part of the hit absorbed by the defender's shield. */
  shieldBlocked: number
  /** Damage that reached the opponent's health. */
  damage: number
  gemsGained: number
  masteryGained: number
  healed: number
  focus: boolean
  /** Both players' health after the turn. */
  health: [number, number]
}

/** Running counters for the turn in progress, plus where it started. */
export interface TurnTracker {
  startElapsedMs: number
  startHealth: number
  startMastery: number
  gemsGained: number
}

export const newTracker = (startElapsedMs: number, startHealth: number, startMastery: number): TurnTracker => ({
  startElapsedMs,
  startHealth,
  startMastery,
  gemsGained: 0,
})

export interface PlayerSummary {
  turns: number
  damageDealt: number
  biggestHit: number
  powerGenerated: number
  onChampions: number
  /** Damage this player's shields absorbed when defending. */
  shieldsBlocked: number
  gemsGained: number
  masteryGained: number
  healed: number
  focusUsed: number
  avgTurnMs: number
  longestTurnMs: number
}

export function summarize(log: TurnRecord[], seat: Seat): PlayerSummary {
  const mine = log.filter((t) => t.player === seat)
  const theirs = log.filter((t) => t.player !== seat)
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const totalMs = sum(mine.map((t) => t.durationMs))
  return {
    turns: mine.length,
    damageDealt: sum(mine.map((t) => t.damage)),
    biggestHit: Math.max(0, ...mine.map((t) => t.damage)),
    powerGenerated: sum(mine.map((t) => t.power)),
    onChampions: sum(mine.map((t) => t.onChampions)),
    shieldsBlocked: sum(theirs.map((t) => t.shieldBlocked)),
    gemsGained: sum(mine.map((t) => t.gemsGained)),
    masteryGained: sum(mine.map((t) => t.masteryGained)),
    healed: sum(mine.map((t) => t.healed)),
    focusUsed: mine.filter((t) => t.focus).length,
    avgTurnMs: mine.length ? totalMs / mine.length : 0,
    longestTurnMs: Math.max(0, ...mine.map((t) => t.durationMs)),
  }
}

/** Health of both players after each turn, starting with the opening values. */
export function healthTimeline(log: TurnRecord[]): Array<[number, number]> {
  return [[MAX_HEALTH, MAX_HEALTH], ...log.map((t) => t.health)]
}
