import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Label, Tap } from './ui'

interface Props {
  label: string
  hint?: string
  value: ReactNode
  /** Running total of the gesture in progress; shown in the undo slot. */
  pending?: number
  /** Total of the last closed gesture; the undo slot becomes a button. */
  undoAmount?: number
  onTap?: (delta: number) => void
  onUndo?: () => void
  disabled?: boolean
  /** Content of the fixed-height footer slot (button or bar). Every card has the slot so steppers line up. */
  footer?: ReactNode
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)

export function Counter({ label, hint, value, pending, undoAmount, onTap, onUndo, disabled, footer }: Props) {
  const hasPending = !!pending
  const hasUndo = !hasPending && !!undoAmount && !!onUndo
  return (
    <div className="flex min-h-0 flex-col gap-1.5 rounded-lg border border-line bg-panel/70 p-2.5">
      <div className="flex h-5 items-center justify-between">
        <Label>
          {label}
          {hint && <span className="ml-1 font-normal normal-case tracking-normal text-muted/70">{hint}</span>}
        </Label>
        {/* One slot: the running count while tapping, then the undo button for that count. */}
        <AnimatePresence mode="wait" initial={false}>
          {hasPending && (
            <motion.span
              key="pending"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded bg-paper px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-ink tabular-nums"
            >
              {signed(pending)}
            </motion.span>
          )}
          {hasUndo && (
            <motion.button
              key="undo"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              onClick={onUndo}
              className="rounded border border-paper/50 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-paper tabular-nums active:bg-paper active:text-ink"
            >
              ↶ Undo {signed(undoAmount!)}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 items-center gap-2">
        <Tap className="h-12 w-12" onClick={() => onTap?.(-1)} disabled={disabled} aria-label={`${label} minus one`}>
          −
        </Tap>
        <div className="flex flex-1 items-center justify-center">
          <span className="font-display text-5xl font-bold leading-none tabular-nums">{value}</span>
        </div>
        <Tap className="h-12 w-12" onClick={() => onTap?.(+1)} disabled={disabled} aria-label={`${label} plus one`}>
          +
        </Tap>
      </div>

      <CardFooter>{footer}</CardFooter>
    </div>
  )
}

/** Fixed-height footer so the stepper rows of all four cards sit on the same line. */
export function CardFooter({ children }: { children?: ReactNode }) {
  return <div className="flex h-8 shrink-0 flex-col justify-center">{children}</div>
}
