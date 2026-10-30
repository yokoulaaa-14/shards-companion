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
import { elapsedAt, pauseTimer, resumeTimer, startTimer, stoppedTimer, type GameTimer } from '../game/timer'
import { newTracker, type TurnRecord, type TurnTracker } from '../game/stats'

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
  /** Game time; starts on FIGHT, paused by the menu, the background and the end of the game. */
  timer: GameTimer
  menuOpen: boolean
  /** One record per finished turn, for the stats screen. */
  log: TurnRecord[]
  /** Counters for the turn in progress. */
  tracker: TurnTracker | null

  openMenu: () => void
  closeMenu: () => void
  /** Called on visibility changes: the timer only counts while the board is on screen. */
  setVisible: (visible: boolean) => void
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
  /** Apply the attack outcome, log the turn, reset the active player's turn resources and pass the turn. */
  endTurn: (outcome: { damage: number; onChampions?: number; shieldBlocked?: number }) => void
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
      timer: stoppedTimer(),
      menuOpen: false,
      log: [],
      tracker: null,

      openMenu: () => {
        get().commitPending()
        set({ menuOpen: true, timer: pauseTimer(get().timer, Date.now()) })
      },

      closeMenu: () => {
        const { phase, timer } = get()
        set({ menuOpen: false, timer: phase === 'board' ? resumeTimer(timer, Date.now()) : timer })
      },

      setVisible: (visible) => {
        const { phase, menuOpen, timer } = get()
        if (!visible) set({ timer: pauseTimer(timer, Date.now()) })
        else if (phase === 'board' && !menuOpen) set({ timer: resumeTimer(timer, Date.now()) })
      },

      startNewGame: () =>
        set({ phase: 'pick', pickStep: 0, players: freshPlayers(), active: 0, turn: 0, attack: null, winner: null, pending: null, timer: stoppedTimer(), menuOpen: false, log: [], tracker: null }),

      resumeGame: () => {
        if (get().phase === 'home' && get().turn > 0) set({ phase: 'board', timer: resumeTimer(get().timer, Date.now()) })
      },

      openPhotos: () => set({ phase: 'photos' }),
      goHome: () => set({ phase: 'home', menuOpen: false, timer: pauseTimer(get().timer, Date.now()) }),

      /** After the end game: wipe the finished game and return to the home screen. */
      finishGame: () =>
        set({ phase: 'home', pickStep: 0, players: freshPlayers(), active: 0, turn: 0, attack: null, winner: null, pending: null, timer: stoppedTimer(), menuOpen: false, log: [], tracker: null }),

      pickHero: (choice) => {
        const { pickStep, players } = get()
        const taken = players.map((p) => p.hero)
        const hero = choice === 'random' ? randomHero(taken) : choice
        const next = [...players] as [PlayerState, PlayerState]
        next[pickStep] = { ...next[pickStep], hero }
        if (pickStep === 0) set({ players: next, pickStep: 1 })
        else set({ players: next, phase: 'versus' })
      },

      fight: () => {
        const p0 = get().players[0]
        set({ phase: 'board', active: 0, turn: 1, timer: startTimer(Date.now()), log: [], tracker: newTracker(0, p0.health, p0.mastery) })
      },

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
        const tracker = get().tracker
        const counted =
          pending.resource === 'gems' && pending.delta > 0 && tracker ? { ...tracker, gemsGained: tracker.gemsGained + pending.delta } : tracker
        set({ players: next, pending: null, tracker: counted })
      },

      undo: (resource) => {
        get().commitPending()
        const { active, players, tracker } = get()
        const amount = players[active].undo[resource] ?? 0
        const next = [...players] as [PlayerState, PlayerState]
        next[active] = undoGesture(next[active], resource)
        const t =
          resource === 'gems' && amount > 0 && tracker ? { ...tracker, gemsGained: Math.max(0, tracker.gemsGained - amount) } : tracker
        set({ players: next, tracker: t })
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
          const now = Date.now()
          const record = makeRecord(get(), now, { damage: 0, onChampions: 0, shieldBlocked: 0 }, players)
          set({ phase: 'endgame', winner: active, attack: null, timer: pauseTimer(get().timer, now), log: [...get().log, record], tracker: null })
          return
        }
        // Nothing to deal: pass the turn without the attack steps.
        if (players[active].power === 0) {
          get().endTurn({ damage: 0 })
          return
        }
        set({ attack: { step: 1, onChampions: 0, shield: 0 } })
      },

      endTurn: ({ damage, onChampions = 0, shieldBlocked = 0 }) => {
        const { active, players, turn, timer, log } = get()
        const now = Date.now()
        const defenderIndex: PlayerIndex = active === 0 ? 1 : 0
        const next = [...players] as [PlayerState, PlayerState]
        next[defenderIndex] = takeDamage(next[defenderIndex], damage)
        const dealt = players[defenderIndex].health - next[defenderIndex].health
        const record = makeRecord(get(), now, { damage: dealt, onChampions, shieldBlocked }, next)
        next[active] = endOfTurnReset(next[active])
        const nextLog = [...log, record]
        if (isDefeated(next[defenderIndex])) {
          set({ players: next, attack: null, phase: 'endgame', winner: active, timer: pauseTimer(timer, now), log: nextLog, tracker: null })
          return
        }
        const d = next[defenderIndex]
        set({
          players: next,
          attack: null,
          active: defenderIndex,
          turn: turn + 1,
          pending: null,
          log: nextLog,
          tracker: newTracker(elapsedAt(timer, now), d.health, d.mastery),
        })
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
        const { toOpponent, damage } = resolveAttack({ power: attacker.power, onChampions: attack.onChampions, shield: attack.shield })
        get().endTurn({ damage, onChampions: Math.min(attack.onChampions, attacker.power), shieldBlocked: toOpponent - damage })
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
        // Saved as a paused snapshot: time while the app is closed never counts.
        timer: { elapsedMs: elapsedAt(s.timer, Date.now()), runningSince: null },
        log: s.log,
        tracker: s.tracker,
      }),
    },
  ),
)

export const opponentOf = (i: PlayerIndex): PlayerIndex => (i === 0 ? 1 : 0)

/**
 * Build the log entry for the active player's turn. `after` holds both players
 * once the attack is applied, before the attacker's turn resources reset.
 */
function makeRecord(
  s: Pick<GameState, 'active' | 'players' | 'timer' | 'tracker'>,
  now: number,
  outcome: { damage: number; onChampions: number; shieldBlocked: number },
  after: [PlayerState, PlayerState],
): TurnRecord {
  const me = s.players[s.active]
  const t = s.tracker ?? newTracker(elapsedAt(s.timer, now), me.health, me.mastery)
  return {
    player: s.active,
    durationMs: Math.max(0, elapsedAt(s.timer, now) - t.startElapsedMs),
    power: me.powerInfinite ? 0 : me.power,
    infinite: me.powerInfinite,
    onChampions: outcome.onChampions,
    shieldBlocked: outcome.shieldBlocked,
    damage: outcome.damage,
    gemsGained: t.gemsGained,
    masteryGained: Math.max(0, me.mastery - t.startMastery),
    healed: Math.max(0, me.health - t.startHealth),
    focus: me.boughtMasteryThisTurn,
    health: [after[0].health, after[1].health],
  }
}

if (import.meta.env.DEV) {
  ;(window as unknown as { game: typeof useGame }).game = useGame
}
