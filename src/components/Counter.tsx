import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Label, Tap } from './ui'

interface Props {
  label: string
  hint?: string
  value: ReactNode
  pending?: number
  undoAmount?: number
  onTap?: (delta: number) => void
  onUndo?: () => void
  disabled?: boolean
  /** Extra content under the stepper (buy button, mastery bar, infinity toggle). */
  children?: ReactNode
  /** Render the stepper row horizontally (− value +) or with buttons under the value. */
  layout?: 'inline' | 'stacked'
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)

export function Counter({ label, hint, value, pending, undoAmount, onTap, onUndo, disabled, children, layout = 'inline' }: Props) {
  const hasPending = !!pending
  const hasUndo = !hasPending && !!undoAmount && !!onUndo
  return (
    <div className="flex min-h-0 flex-col gap-1.5 rounded-lg border border-line bg-panel p-2.5">
      <div className="flex h-5 items-center justify-between">
        <Label>
          {label}
          {hint && <span className="ml-1 font-normal normal-case tracking-normal text-muted/70">{hint}</span>}
        </Label>
        <AnimatePresence>
          {hasUndo && (
            <motion.button
              key="undo"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={onUndo}
              className="rounded border border-paper/50 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-paper active:bg-paper active:text-ink"
            >
              ↶ Undo {signed(undoAmount!)}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {layout === 'inline' ? (
        <div className="flex flex-1 items-center gap-2">
          <Tap className="h-12 w-12" onClick={() => onTap?.(-1)} disabled={disabled} aria-label={`${label} minus one`}>
            −
          </Tap>
          <Value value={value} pending={pending} />
          <Tap className="h-12 w-12" onClick={() => onTap?.(+1)} disabled={disabled} aria-label={`${label} plus one`}>
            +
          </Tap>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          <Value value={value} pending={pending} />
          <div className="flex gap-1.5">
            <Tap className="h-11 flex-1" onClick={() => onTap?.(-1)} disabled={disabled} aria-label={`${label} minus one`}>
              −
            </Tap>
            <Tap className="h-11 flex-1" onClick={() => onTap?.(+1)} disabled={disabled} aria-label={`${label} plus one`}>
              +
            </Tap>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}

function Value({ value, pending }: { value: ReactNode; pending?: number }) {
  return (
    <div className="relative flex flex-1 items-center justify-center">
      <span className="font-display text-5xl font-bold leading-none tabular-nums">{value}</span>
      <AnimatePresence>
        {!!pending && (
          <motion.span
            key="pending"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-2 right-0 rounded bg-paper px-1.5 py-0.5 font-display text-xs font-bold text-ink tabular-nums"
          >
            {signed(pending)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
