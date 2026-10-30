import { useEffect } from 'react'
import { useGame } from '../store/gameStore'

/**
 * The game timer only counts while the board is actually on screen:
 * - pauses when the phone locks or the app goes to the background,
 * - resumes when it comes back (unless the menu is open),
 * - resumes on app start when a saved game is reopened straight on the board.
 */
export function useTimerLifecycle() {
  useEffect(() => {
    const setVisible = useGame.getState().setVisible
    setVisible(document.visibilityState === 'visible')
    const onVisibility = () => setVisible(document.visibilityState === 'visible')
    const onPageHide = () => setVisible(false)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])
}
