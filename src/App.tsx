import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from './store/gameStore'
import { useWakeLock } from './hooks/useWakeLock'
import { Home } from './screens/Home'
import { Pick } from './screens/Pick'
import { Versus } from './screens/Versus'
import { Board } from './screens/Board'
import { EndGame } from './screens/EndGame'

const screens = { home: Home, pick: Pick, versus: Versus, board: Board, endgame: EndGame } as const

export default function App() {
  const phase = useGame((s) => s.phase)
  useWakeLock(phase === 'board')
  const Screen = screens[phase]

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          className="h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
      <RotateHint />
    </div>
  )
}

/** Shown when the phone is held in portrait; the layout is designed for landscape only. */
function RotateHint() {
  return (
    <div className="absolute inset-0 z-50 hidden flex-col items-center justify-center gap-4 bg-ink p-8 text-center portrait:flex">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M2 12a10 10 0 0 1 3-7.1M22 12a10 10 0 0 1-3 7.1" />
        <path d="M5 2v3H2M19 22v-3h3" />
      </svg>
      <p className="font-display text-xl font-bold">Turn your phone sideways</p>
      <p className="max-w-xs text-sm text-muted">Lay it flat between you, in landscape.</p>
    </div>
  )
}
