import { MASTERY_THRESHOLDS, masterySegments } from '../game/rules'

export function MasteryBar({ mastery }: { mastery: number }) {
  const segments = masterySegments(mastery)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-2.5 gap-0.5">
        {segments.map((fill, i) => (
          <div key={i} className="flex flex-1 overflow-hidden rounded-sm border border-line bg-ink">
            <div className="h-full bg-paper transition-[width] duration-300" style={{ width: `${fill * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between font-display text-[9px] font-bold tracking-widest text-muted">
        {MASTERY_THRESHOLDS.map((t) => (
          <span key={t} className={mastery >= t ? 'text-paper' : ''}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
