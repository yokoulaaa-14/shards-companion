import { describe, expect, it } from 'vitest'
import {
  applyGesture,
  buyMastery,
  canBuyMastery,
  endOfTurnReset,
  isDefeated,
  masterySegments,
  newPlayer,
  resolveAttack,
  takeDamage,
  toggleInfinity,
  undoBuyMastery,
  undoGesture,
} from './rules'
import { randomHero } from './heroes'

describe('gestures and undo', () => {
  it('applies a merged gesture and records it for undo', () => {
    const { player, applied } = applyGesture(newPlayer(), 'power', 6)
    expect(player.power).toBe(6)
    expect(applied).toBe(6)
    expect(player.undo.power).toBe(6)
  })

  it('undo reverts exactly the committed gesture', () => {
    const a = applyGesture(newPlayer(), 'gems', 3).player
    const b = applyGesture(a, 'gems', -1).player
    expect(b.gems).toBe(2)
    expect(undoGesture(b, 'gems').gems).toBe(3)
  })

  it('clamps health to 0..50 and undoes only what was applied', () => {
    const p0 = { ...newPlayer(), health: 48 }
    const { player, applied } = applyGesture(p0, 'health', 5)
    expect(player.health).toBe(50)
    expect(applied).toBe(2)
    expect(undoGesture(player, 'health').health).toBe(48)
    const low = applyGesture({ ...newPlayer(), health: 2 }, 'health', -9).player
    expect(low.health).toBe(0)
  })

  it('clamps mastery to 30 and turn resources to >= 0', () => {
    expect(applyGesture({ ...newPlayer(), mastery: 29 }, 'mastery', 3).player.mastery).toBe(30)
    expect(applyGesture(newPlayer(), 'power', -4).player.power).toBe(0)
  })
})

describe('buy mastery', () => {
  it('needs a gem, once per turn, below 30', () => {
    expect(canBuyMastery(newPlayer())).toBe(false)
    const withGem = { ...newPlayer(), gems: 1 }
    expect(canBuyMastery(withGem)).toBe(true)
    const bought = buyMastery(withGem)
    expect(bought.gems).toBe(0)
    expect(bought.mastery).toBe(1)
    expect(canBuyMastery({ ...bought, gems: 5 })).toBe(false)
    expect(canBuyMastery({ ...newPlayer(), gems: 5, mastery: 30 })).toBe(false)
  })

  it('ghost undo restores the gem and the mastery point', () => {
    const bought = buyMastery({ ...newPlayer(), gems: 2, mastery: 5 })
    const undone = undoBuyMastery(bought)
    expect(undone.gems).toBe(2)
    expect(undone.mastery).toBe(5)
    expect(undone.boughtMasteryThisTurn).toBe(false)
  })

  it('a later change on gems or mastery disables the ghost undo', () => {
    const bought = buyMastery({ ...newPlayer(), gems: 2 })
    const later = applyGesture(bought, 'gems', 2).player
    expect(later.buyUndoable).toBe(false)
    expect(undoBuyMastery(later)).toBe(later)
  })
})

describe('attack resolution', () => {
  it('splits power between champions and the opponent, then applies the shield', () => {
    expect(resolveAttack({ power: 6, onChampions: 2, shield: 1 })).toEqual({ toOpponent: 4, damage: 3 })
  })

  it('never goes negative and caps champions at the available power', () => {
    expect(resolveAttack({ power: 3, onChampions: 9, shield: 0 })).toEqual({ toOpponent: 0, damage: 0 })
    expect(resolveAttack({ power: 4, onChampions: 0, shield: 10 })).toEqual({ toOpponent: 4, damage: 0 })
  })

  it('damage can defeat a player', () => {
    const hit = takeDamage({ ...newPlayer(), health: 3 }, 5)
    expect(hit.health).toBe(0)
    expect(isDefeated(hit)).toBe(true)
  })
})

describe('turn lifecycle', () => {
  it('end of turn clears gems, power, infinity, buy flag and undo history', () => {
    const busy = {
      ...applyGesture(buyMastery({ ...newPlayer(), gems: 4 }), 'power', 7).player,
      powerInfinite: true,
    }
    const reset = endOfTurnReset(busy)
    expect(reset.gems).toBe(0)
    expect(reset.power).toBe(0)
    expect(reset.powerInfinite).toBe(false)
    expect(reset.boughtMasteryThisTurn).toBe(false)
    expect(reset.undo).toEqual({})
    expect(reset.mastery).toBe(busy.mastery)
  })

  it('infinity remembers and restores the previous power', () => {
    const p = applyGesture(newPlayer(), 'power', 5).player
    const inf = toggleInfinity(p)
    expect(inf.powerInfinite).toBe(true)
    expect(toggleInfinity(inf).power).toBe(5)
  })
})

describe('mastery bar', () => {
  it('fills segments progressively', () => {
    expect(masterySegments(0)).toEqual([0, 0, 0, 0, 0, 0])
    expect(masterySegments(12)).toEqual([1, 1, 0.4, 0, 0, 0])
    expect(masterySegments(30)).toEqual([1, 1, 1, 1, 1, 1])
  })
})

describe('random hero', () => {
  it('never picks a hero already taken', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomHero(['tetra'])).not.toBe('tetra')
    }
    expect(randomHero(['decima', 'kosynwu', 'tetra', 'volos'], () => 0.99)).toBe('rez')
  })
})
