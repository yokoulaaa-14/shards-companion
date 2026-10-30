import { describe, expect, it } from 'vitest'
import { healthTimeline, summarize, type TurnRecord } from './stats'

const turn = (over: Partial<TurnRecord>): TurnRecord => ({
  player: 0,
  durationMs: 60_000,
  power: 0,
  infinite: false,
  onChampions: 0,
  shieldBlocked: 0,
  damage: 0,
  gemsGained: 0,
  masteryGained: 0,
  healed: 0,
  focus: false,
  health: [50, 50],
  ...over,
})

const log: TurnRecord[] = [
  turn({ player: 0, durationMs: 90_000, power: 6, onChampions: 2, shieldBlocked: 1, damage: 3, gemsGained: 4, masteryGained: 1, focus: true, health: [50, 47] }),
  turn({ player: 1, durationMs: 30_000, power: 5, damage: 5, gemsGained: 2, health: [45, 47] }),
  turn({ player: 0, durationMs: 150_000, power: 9, shieldBlocked: 2, damage: 7, healed: 3, masteryGained: 2, health: [48, 40] }),
  turn({ player: 1, durationMs: 60_000, power: 0, health: [48, 40] }),
]

describe('stats summary', () => {
  it('adds up what each player did on their own turns', () => {
    const p0 = summarize(log, 0)
    expect(p0.turns).toBe(2)
    expect(p0.damageDealt).toBe(10)
    expect(p0.biggestHit).toBe(7)
    expect(p0.powerGenerated).toBe(15)
    expect(p0.onChampions).toBe(2)
    expect(p0.gemsGained).toBe(4)
    expect(p0.masteryGained).toBe(3)
    expect(p0.healed).toBe(3)
    expect(p0.focusUsed).toBe(1)
    expect(p0.avgTurnMs).toBe(120_000)
    expect(p0.longestTurnMs).toBe(150_000)
  })

  it("counts shield blocks on the defender's side", () => {
    expect(summarize(log, 1).shieldsBlocked).toBe(3)
    expect(summarize(log, 0).shieldsBlocked).toBe(0)
  })

  it('handles a player with no turns', () => {
    const s = summarize([], 1)
    expect(s.turns).toBe(0)
    expect(s.biggestHit).toBe(0)
    expect(s.avgTurnMs).toBe(0)
  })
})

describe('health timeline', () => {
  it('starts at full health and follows each turn', () => {
    expect(healthTimeline(log)).toEqual([
      [50, 50],
      [50, 47],
      [45, 47],
      [48, 40],
      [48, 40],
    ])
  })
})
