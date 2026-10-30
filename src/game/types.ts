export type HeroId = 'decima' | 'kosynwu' | 'tetra' | 'volos' | 'rez'

export type Resource = 'health' | 'mastery' | 'gems' | 'power'

export interface PlayerState {
  hero: HeroId | null
  health: number
  mastery: number
  gems: number
  power: number
  powerInfinite: boolean
  /** Power value before ∞ was toggled, restored by "cancel infinity". */
  powerBeforeInfinite: number
  boughtMasteryThisTurn: boolean
  /** True until another change on gems or mastery makes the buy no longer undoable. */
  buyUndoable: boolean
  /** Last committed gesture per resource: the delta that was applied. */
  undo: Partial<Record<Resource, number>>
}

export interface AttackState {
  step: 1 | 2
  onChampions: number
  shield: number
}

export type Phase = 'home' | 'photos' | 'pick' | 'versus' | 'board' | 'endgame'
