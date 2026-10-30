import type { PlayerState, Resource } from './types'

export const MAX_HEALTH = 50
export const MAX_MASTERY = 30
export const MASTERY_THRESHOLDS = [5, 10, 15, 20, 25, 30] as const
/** Mastery the second player starts with, as compensation for going second. */
export const SECOND_PLAYER_START_MASTERY = 1
/** Quick successive taps on one resource within this window merge into one gesture. */
export const GESTURE_WINDOW_MS = 1000

export function newPlayer(startMastery = 0): PlayerState {
  return {
    hero: null,
    health: MAX_HEALTH,
    mastery: startMastery,
    gems: 0,
    power: 0,
    powerInfinite: false,
    powerBeforeInfinite: 0,
    boughtMasteryThisTurn: false,
    buyUndoable: false,
    undo: {},
  }
}

export function clampResource(resource: Resource, value: number): number {
  switch (resource) {
    case 'health':
      return Math.min(MAX_HEALTH, Math.max(0, value))
    case 'mastery':
      return Math.min(MAX_MASTERY, Math.max(0, value))
    default:
      return Math.max(0, value)
  }
}

/**
 * Apply one tap to a resource immediately. Quick successive taps form a gesture:
 * the tap clears any older undo entry for that resource, and `recordGesture`
 * stores the gesture's total once it ends. Returns the delta really applied
 * after clamping.
 */
export function applyTap(
  player: PlayerState,
  resource: Resource,
  delta: number,
): { player: PlayerState; applied: number } {
  const before = player[resource]
  const after = clampResource(resource, before + delta)
  const applied = after - before
  const undo = { ...player.undo }
  delete undo[resource]
  const touchesBuy = resource === 'gems' || resource === 'mastery'
  return {
    player: {
      ...player,
      [resource]: after,
      undo,
      buyUndoable: touchesBuy && applied !== 0 ? false : player.buyUndoable,
    },
    applied,
  }
}

/** Close a gesture: remember its total so UNDO can revert exactly that. */
export function recordGesture(player: PlayerState, resource: Resource, total: number): PlayerState {
  const undo = { ...player.undo }
  if (total === 0) delete undo[resource]
  else undo[resource] = total
  return { ...player, undo }
}

/** Apply a whole gesture at once (taps then record). Convenience for tests and tools. */
export function applyGesture(player: PlayerState, resource: Resource, delta: number): PlayerState {
  const { player: tapped, applied } = applyTap(player, resource, delta)
  return recordGesture(tapped, resource, applied)
}

export function undoGesture(player: PlayerState, resource: Resource): PlayerState {
  const applied = player.undo[resource]
  if (!applied) return player
  const undo = { ...player.undo }
  delete undo[resource]
  return { ...player, [resource]: player[resource] - applied, undo }
}

export function canBuyMastery(player: PlayerState): boolean {
  return player.gems >= 1 && !player.boughtMasteryThisTurn && player.mastery < MAX_MASTERY
}

export function buyMastery(player: PlayerState): PlayerState {
  if (!canBuyMastery(player)) return player
  const undo = { ...player.undo }
  delete undo.gems
  delete undo.mastery
  return {
    ...player,
    gems: player.gems - 1,
    mastery: player.mastery + 1,
    boughtMasteryThisTurn: true,
    buyUndoable: true,
    undo,
  }
}

export function undoBuyMastery(player: PlayerState): PlayerState {
  if (!player.boughtMasteryThisTurn || !player.buyUndoable) return player
  return {
    ...player,
    gems: player.gems + 1,
    mastery: player.mastery - 1,
    boughtMasteryThisTurn: false,
    buyUndoable: false,
  }
}

export function toggleInfinity(player: PlayerState): PlayerState {
  if (player.powerInfinite) {
    return { ...player, powerInfinite: false, power: player.powerBeforeInfinite }
  }
  return { ...player, powerInfinite: true, powerBeforeInfinite: player.power, power: 0, undo: { ...player.undo, power: undefined } }
}

export interface AttackInput {
  power: number
  onChampions: number
  shield: number
}

export interface AttackResult {
  /** Power left for the opponent after champions. */
  toOpponent: number
  /** Final damage after the opponent's shield. */
  damage: number
}

export function resolveAttack({ power, onChampions, shield }: AttackInput): AttackResult {
  const spent = Math.min(Math.max(0, onChampions), Math.max(0, power))
  const toOpponent = Math.max(0, power - spent)
  const damage = Math.max(0, toOpponent - Math.max(0, shield))
  return { toOpponent, damage }
}

export function takeDamage(player: PlayerState, damage: number): PlayerState {
  return { ...player, health: clampResource('health', player.health - damage) }
}

export function isDefeated(player: PlayerState): boolean {
  return player.health <= 0
}

/** Reset the turn resources of a player whose turn just ended. */
export function endOfTurnReset(player: PlayerState): PlayerState {
  return {
    ...player,
    gems: 0,
    power: 0,
    powerInfinite: false,
    powerBeforeInfinite: 0,
    boughtMasteryThisTurn: false,
    buyUndoable: false,
    undo: {},
  }
}

/** One flag per mastery check (5, 10, … 30): true once that threshold is reached. */
export function masteryReached(mastery: number): boolean[] {
  return MASTERY_THRESHOLDS.map((t) => mastery >= t)
}
