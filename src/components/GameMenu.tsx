import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { Button, Label } from './ui'

type View = 'closed' | 'menu' | 'confirm'

/**
 * Menu button fixed in the board's top-right corner. It sits in free space
 * whichever player is active: the waiting panel's header when the left player
 * plays, the right player's art header when they play.
 */
export function GameMenu() {
  const [view, setView] = useState<View>('closed')
  const startNewGame = useGame((s) => s.startNewGame)
  const goHome = useGame((s) => s.goHome)
  const commitPending = useGame((s) => s.commitPending)

  const open = () => {
    commitPending()
    setView('menu')
  }
  const close = () => setView('closed')

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Open menu"
        className="absolute top-3 right-3 z-[15] flex h-7 w-9 items-center justify-center rounded-md border border-paper/50 bg-ink/70 text-paper backdrop-blur-sm active:bg-paper active:text-ink"
      >
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
          <path d="M1 1h14M1 6h14M1 11h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {view !== 'closed' && (
          <motion.div
            key="scrim"
            className="absolute inset-0 z-40 flex items-center justify-center bg-ink/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
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
                    <Label>Menu</Label>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close menu"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-sm text-paper/80 active:bg-paper active:text-ink"
                    >
                      ✕
                    </button>
                  </div>
                  <Button className="h-12" onClick={close}>
                    Resume
                  </Button>
                  <Button variant="secondary" className="h-12" onClick={() => setView('confirm')}>
                    Start a new game
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-12"
                    onClick={() => {
                      close()
                      goHome()
                    }}
                  >
                    Back to home
                  </Button>
                  <p className="text-center text-[11px] text-muted">Back to home keeps this game. Home offers Resume.</p>
                </>
              ) : (
                <>
                  <Label>Start a new game</Label>
                  <h2 className="font-display text-2xl font-bold leading-tight">Abandon this game?</h2>
                  <p className="text-sm text-muted">Health, Mastery and turn are lost. You'll go back to the Shard Master selection.</p>
                  <div className="mt-1 flex gap-2.5">
                    <Button variant="secondary" className="h-12 w-32" onClick={() => setView('menu')}>
                      Cancel
                    </Button>
                    <Button
                      className="h-12 flex-1"
                      onClick={() => {
                        close()
                        startNewGame()
                      }}
                    >
                      Start new game
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
