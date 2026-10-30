import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AttackState, HeroId, Phase, PlayerState, Resource } from '../game/types'
import { randomHero } from '../game/heroes'
import {
  applyTap,
  buyMastery,
  recordGesture,
  endOfTurnReset,
  GESTURE_WINDOW_MS,
  isDefeated,
  newPlayer,
  resolveAttack,
  SECOND_PLAYER_START_MASTERY,
  takeDamage,
  toggleInfinity,
  undoBuyMastery,
  undoGesture,
} from '../game/rules'

export type PlayerIndex = 0 | 1

export interface PendingGesture {
  player: PlayerIndex
  resource: Resource
  delta: number
}

interface GameState {
  phase: Phase
  pickStep: PlayerIndex
  players: [PlayerState, PlayerState]
  active: PlayerIndex
  turn: number
  attack: AttackState | null
  winner: PlayerIndex | null
  pending: PendingGesture | null

  startNewGame: () => void
  resumeGame: () => void
  openPhotos: () => void
  goHome: () => void
  finishGame: () => void
  pickHero: (choice: HeroId | 'random') => void
  fight: () => void
  tap: (resource: Resource, delta: number) => void
  commitPending: () => void
  undo: (resource: Resource) => void
  buyMastery: () => void
  undoBuyMastery: () => void
  toggleInfinity: () => void
  openAttack: () => void
  /** Apply `damage` to the opponent, reset the active player's turn resources and pass the turn. */
  endTurn: (damage: number) => void
  setOnChampions: (n: number) => void
  setShield: (n: number) => void
  confirmStep1: () => void
  backToStep1: () => void
  cancelAttack: () => void
  validateShield: () => void
}

let gestureTimer: ReturnType<typeof setTimeout> | null = null

function freshPlayers(): [PlayerState, PlayerState] {
  return [newPlayer(0), newPlayer(SECOND_PLAYER_START_MASTERY)]
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'home',
      pickStep: 0,
      players: freshPlayers(),
      active: 0,
      turn: 0,
      attack: null,
      winner: null,
      pending: null,

      startNewGame: () =>
        set({ phase: 'pick', pickStep: 0, players: freshPlayers(), active: 0, turn: 0, attack: null, winner: null, pending: null }),

      resumeGame: () => {
        if (get().phase === 'home' && get().turn > 0) set({ phase: 'board' })
      },

      openPhotos: () => set({ phase: 'photos' }),
      goHome: () => set({ phase: 'home' }),

      /** After the end game: wipe the finished game and return to the home screen. */
      finishGame: () =>
        set({ phase: 'home', pickStep: 0, players: freshPlayers(), active: 0, turn: 0, attack: null, winner: null, pending: null }),

      pickHero: (choice) => {
        const { pickStep, players } = get()
        const taken = players.map((p) => p.hero)
        const hero = choice === 'random' ? randomHero(taken) : choice
        const next = [...players] as [PlayerState, PlayerState]
        next[pickStep] = { ...next[pickStep], hero }
        if (pickStep === 0) set({ players: next, pickStep: 1 })
        else set({ players: next, phase: 'versus' })
      },

      fight: () => set({ phase: 'board', active: 0, turn: 1 }),

      // Each tap changes the value at once. Quick successive taps on one resource
      // form a gesture whose running total is shown, then becomes the undo amount.
      tap: (resource, delta) => {
        const { active, pending } = get()
        const sameGesture = pending && pending.player === active && pending.resource === resource
        if (pending && !sameGesture) get().commitPending()
        const players = [...get().players] as [PlayerState, PlayerState]
        const { player, applied } = applyTap(players[active], resource, delta)
        players[active] = player
        const current = get().pending
        const merged =
          current && current.player === active && current.resource === resource
            ? { ...current, delta: current.delta + applied }
            : { player: active, resource, delta: applied }
        set({ players, pending: merged })
        if (gestureTimer) clearTimeout(gestureTimer)
        gestureTimer = setTimeout(() => useGame.getState().commitPending(), GESTURE_WINDOW_MS)
      },

      commitPending: () => {
        const { pending, players } = get()
        if (gestureTimer) {
          clearTimeout(gestureTimer)
          gestureTimer = null
        }
        if (!pending) return
        const next = [...players] as [PlayerState, PlayerState]
        next[pending.player] = recordGesture(next[pending.player], pending.resource, pending.delta)
        set({ players: next, pending: null })
      },

      undo: (resource) => {
        get().commitPending()
        const { active, players } = get()
        const next = [...players] as [PlayerState, PlayerState]
        next[active] = undoGesture(next[active], resource)
        set({ players: next })
      },

      buyMastery: () => {
        get().commitPending()
        const { active, players } = get()
        const next = [...players] as [PlayerState, PlayerState]
        next[active] = buyMastery(next[active])
        set({ players: next })
      },

      undoBuyMastery: () => {
        const { active, players } = get()
        const next = [...players] as [PlayerState, PlayerState]
        next[active] = undoBuyMastery(next[active])
        set({ players: next })
      },

      toggleInfinity: () => {
        get().commitPending()
        const { active, players } = get()
        const next = [...players] as [PlayerState, PlayerState]
        next[active] = toggleInfinity(next[active])
        set({ players: next })
      },

      openAttack: () => {
        get().commitPending()
        const { active, players } = get()
        if (players[active].powerInfinite) {
          set({ phase: 'endgame', winner: active, attack: null })
          return
        }
        // Nothing to deal: pass the turn without the attack steps.
        if (players[active].power === 0) {
          get().endTurn(0)
          return
        }
        set({ attack: { step: 1, onChampions: 0, shield: 0 } })
      },

      endTurn: (damage) => {
        const { active, players, turn } = get()
        const defenderIndex: PlayerIndex = active === 0 ? 1 : 0
        const next = [...players] as [PlayerState, PlayerState]
        next[defenderIndex] = takeDamage(next[defenderIndex], damage)
        next[active] = endOfTurnReset(next[active])
        if (isDefeated(next[defenderIndex])) {
          set({ players: next, attack: null, phase: 'endgame', winner: active })
          return
        }
        set({ players: next, attack: null, active: defenderIndex, turn: turn + 1, pending: null })
      },

      setOnChampions: (n) => {
        const { attack, active, players } = get()
        if (!attack) return
        const max = players[active].power
        set({ attack: { ...attack, onChampions: Math.min(max, Math.max(0, n)) } })
      },

      setShield: (n) => {
        const { attack } = get()
        if (!attack) return
        set({ attack: { ...attack, shield: Math.max(0, n) } })
      },

      confirmStep1: () => {
        const { attack } = get()
        if (attack) set({ attack: { ...attack, step: 2, shield: 0 } })
      },

      backToStep1: () => {
        const { attack } = get()
        if (attack) set({ attack: { ...attack, step: 1 } })
      },

      cancelAttack: () => set({ attack: null }),

      validateShield: () => {
        const { attack, active, players } = get()
        if (!attack) return
        const attacker = players[active]
        const { damage } = resolveAttack({ power: attacker.power, onChampions: attack.onChampions, shield: attack.shield })
        get().endTurn(damage)
      },
    }),
    {
      name: 'shards-companion',
      partialize: (s) => ({
        phase: s.phase,
        pickStep: s.pickStep,
        players: s.players,
        active: s.active,
        turn: s.turn,
        attack: s.attack,
        winner: s.winner,
      }),
    },
  ),
)

export const opponentOf = (i: PlayerIndex): PlayerIndex => (i === 0 ? 1 : 0)

if (import.meta.env.DEV) {
  ;(window as unknown as { game: typeof useGame }).game = useGame
}
