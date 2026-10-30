import { useEffect, useState } from 'react'
import { elapsedAt, formatDuration, isRunning } from '../game/timer'
import { useGame } from '../store/gameStore'
import { Label } from './ui'

/** Top bar of the board: round number, game timer, menu. */
export function NavBar() {
  // A round is both players playing once: turns 1-2 are round 1, 3-4 round 2.
  const round = useGame((s) => Math.max(1, Math.ceil(s.turn / 2)))
  const openMenu = useGame((s) => s.openMenu)

  return (
    <div className="grid h-9 shrink-0 grid-cols-3 items-center border-b border-line bg-ink px-3">
      <div className="flex items-baseline gap-2">
        <Label>Round</Label>
        <span className="font-display text-lg font-bold leading-none tabular-nums">{round}</span>
      </div>

      <GameClock />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openMenu}
          aria-label="Open menu"
          className="flex h-7 w-9 items-center justify-center rounded-md border border-paper/50 text-paper active:bg-paper active:text-ink"
        >
          <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
            <path d="M1 1h14M1 6h14M1 11h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function GameClock() {
  const timer = useGame((s) => s.timer)
  const running = isRunning(timer)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [running])

  const ms = elapsedAt(timer, running ? now : Date.now())
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Game time ${formatDuration(ms)}${running ? '' : ', paused'}`}>
      {running ? (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="text-paper/80">
          <circle cx="7" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 8V5M5 1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="text-muted">
          <path d="M4 2v10M10 2v10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )}
      <span className={`font-display text-lg font-bold leading-none tabular-nums ${running ? '' : 'text-muted'}`}>{formatDuration(ms)}</span>
      {!running && (
        <span className="rounded border border-dashed border-muted/60 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
          Paused
        </span>
      )}
    </div>
  )
}
