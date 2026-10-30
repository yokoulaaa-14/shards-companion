import { useGame } from '../store/gameStore'
import { Button } from '../components/ui'

export function Home() {
  const startNewGame = useGame((s) => s.startNewGame)
  const resumeGame = useGame((s) => s.resumeGame)
  const openPhotos = useGame((s) => s.openPhotos)
  const canResume = useGame((s) => s.turn > 0 && s.phase === 'home')

  return (
    <div className="flex h-full items-center gap-12 px-12">
      <div className="flex flex-1 flex-col gap-3">
        <span className="font-display text-xs font-bold uppercase tracking-[0.3em] text-muted">Companion · 1 vs 1</span>
        <h1 className="font-display text-6xl font-bold leading-none">Shards of Infinity</h1>
        <p className="max-w-md text-sm text-muted">
          Track Health, Mastery, Gems and Power for two players on one phone. Lay it flat between you, in landscape.
        </p>
      </div>
      <div className="flex w-72 flex-col gap-3">
        <Button className="h-14 text-base" onClick={startNewGame}>
          Start a new game
        </Button>
        {canResume && (
          <Button variant="ghost" className="h-12" onClick={resumeGame}>
            Resume game
          </Button>
        )}
        <Button variant="ghost" className="h-10 text-[11px]" onClick={openPhotos}>
          Hero photos
        </Button>
        <p className="text-center text-[10px] leading-relaxed text-muted/70">
          Unofficial fan-made tool. Not affiliated with Stone Blade Entertainment. No game content included.
        </p>
      </div>
    </div>
  )
}
