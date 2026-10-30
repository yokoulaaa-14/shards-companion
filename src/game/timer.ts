/**
 * Game timer: accumulated time plus the moment it was last (re)started.
 * Pure functions so pausing and resuming can be tested without real time.
 */
export interface GameTimer {
  elapsedMs: number
  /** Epoch ms when the timer was last started or resumed; null while paused. */
  runningSince: number | null
}

export const stoppedTimer = (): GameTimer => ({ elapsedMs: 0, runningSince: null })

export const startTimer = (now: number): GameTimer => ({ elapsedMs: 0, runningSince: now })

export function elapsedAt(t: GameTimer, now: number): number {
  return t.elapsedMs + (t.runningSince === null ? 0 : Math.max(0, now - t.runningSince))
}

export function pauseTimer(t: GameTimer, now: number): GameTimer {
  if (t.runningSince === null) return t
  return { elapsedMs: elapsedAt(t, now), runningSince: null }
}

export function resumeTimer(t: GameTimer, now: number): GameTimer {
  if (t.runningSince !== null) return t
  return { ...t, runningSince: now }
}

export const isRunning = (t: GameTimer) => t.runningSince !== null

/** 75_000 → "1:15", 3_725_000 → "1:02:05". */
export function formatDuration(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** Average time per player turn; 0 when no turn was played. */
export function averageTurnMs(totalMs: number, turns: number): number {
  return turns > 0 ? totalMs / turns : 0
}
