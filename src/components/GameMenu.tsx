import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { Button, Label } from './ui'

type View = 'menu' | 'confirm'

/**
 * Menu dialog opened from the nav bar. While it is open the game timer is
 * paused; the scrim stops below the nav bar so the paused clock stays visible.
 */
export function GameMenu() {
  const menuOpen = useGame((s) => s.menuOpen)
  const closeMenu = useGame((s) => s.closeMenu)
  const startNewGame = useGame((s) => s.startNewGame)
  const goHome = useGame((s) => s.goHome)
  const [view, setView] = useState<View>('menu')

  // Every opening starts on the menu, not on a confirmation left from last time.
  useEffect(() => {
    if (menuOpen) setView('menu')
  }, [menuOpen])

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          key="scrim"
          className="absolute inset-x-0 top-9 bottom-0 z-40 flex items-center justify-center bg-ink/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeMenu}
        >
          <motion.div
            key={view}
            role="dialog"
            aria-modal="true"
            aria-label={view === 'menu' ? 'Menu' : 'Start a new game'}
            className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-5 shadow-2xl"
            style={{ width: view === 'menu' ? 300 : 400 }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {view === 'menu' ? (
              <>
                <div className="flex items-center justify-between">
                  <Label>Menu · game paused</Label>
                  <button
                    type="button"
                    onClick={closeMenu}
                    aria-label="Close menu"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-sm text-paper/80 active:bg-paper active:text-ink"
                  >
                    ✕
                  </button>
                </div>
                <Button className="h-12" onClick={closeMenu}>
                  Resume
                </Button>
                <Button variant="secondary" className="h-12" onClick={() => setView('confirm')}>
                  Start a new game
                </Button>
                <Button variant="secondary" className="h-12" onClick={goHome}>
                  Back to home
                </Button>
                <p className="text-center text-[11px] text-muted">Back to home keeps this game. Home offers Resume.</p>
              </>
            ) : (
              <>
                <Label>Start a new game</Label>
                <h2 className="font-display text-2xl font-bold leading-tight">Abandon this game?</h2>
                <p className="text-sm text-muted">Health, Mastery, turn and time are lost. You'll go back to the Shard Master selection.</p>
                <div className="mt-1 flex gap-2.5">
                  <Button variant="secondary" className="h-12 w-32" onClick={() => setView('menu')}>
                    Cancel
                  </Button>
                  <Button className="h-12 flex-1" onClick={startNewGame}>
                    Start new game
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
