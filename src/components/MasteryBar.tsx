import { MASTERY_THRESHOLDS, masteryReached } from '../game/rules'

/** Six checks (5 … 30). A bar fills only once its threshold is reached. */
export function MasteryBar({ mastery }: { mastery: number }) {
  const reached = masteryReached(mastery)
  return (
    <div className="flex gap-1">
      {MASTERY_THRESHOLDS.map((t, i) => (
        <div key={t} className="flex flex-1 flex-col items-center gap-1">
          <div className={`h-2.5 w-full rounded-sm border border-line transition-colors duration-300 ${reached[i] ? 'bg-paper' : 'bg-ink'}`} />
          <span className={`font-display text-[9px] font-bold leading-none tracking-widest ${reached[i] ? 'text-paper' : 'text-muted'}`}>{t}</span>
        </div>
      ))}
    </div>
  )
}
