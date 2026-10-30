import { AnimatePresence, motion } from 'framer-motion'
import { getHero } from '../game/heroes'
import { resolveAttack } from '../game/rules'
import { opponentOf, useGame } from '../store/gameStore'
import { Button, Label, Tap } from './ui'

/** Two-step attack flow rendered as side drawers over the board. */
export function AttackDrawer() {
  const attack = useGame((s) => s.attack)
  const active = useGame((s) => s.active)
  const players = useGame((s) => s.players)
  const setOnChampions = useGame((s) => s.setOnChampions)
  const setShield = useGame((s) => s.setShield)
  const confirmStep1 = useGame((s) => s.confirmStep1)
  const backToStep1 = useGame((s) => s.backToStep1)
  const cancelAttack = useGame((s) => s.cancelAttack)
  const validateShield = useGame((s) => s.validateShield)

  const attacker = players[active]
  const defender = players[opponentOf(active)]
  const attackerHero = attacker.hero ? getHero(attacker.hero) : null
  const defenderHero = defender.hero ? getHero(defender.hero) : null

  // Drawer sides follow seats: player 0 sits left, player 1 sits right.
  const attackerSide = active === 0 ? 'left' : 'right'
  const defenderSide = active === 0 ? 'right' : 'left'

  const result = attack
    ? resolveAttack({ power: attacker.power, onChampions: attack.onChampions, shield: attack.shield })
    : null

  return (
    <AnimatePresence>
      {attack && (
        <motion.div
          key="scrim"
          className="absolute inset-0 z-20 bg-ink/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={attack.step === 1 ? cancelAttack : undefined}
        />
      )}

      {attack && attack.step === 1 && attackerHero && defenderHero && result && (
        <Drawer key="step1" side={attackerSide} color={attackerHero.color}>
          <Label>
            {attackerHero.name} · End turn · Step 1 of 2
          </Label>
          <h2 className="font-display text-2xl font-bold leading-tight">
            {attacker.power} Power accumulated. How much on {defenderHero.name}'s champions?
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <Stepper
              label="On champions"
              value={attack.onChampions}
              onChange={setOnChampions}
              max={attacker.power}
            />
            <Result label={`To ${defenderHero.name}`} value={result.toOpponent} />
          </div>
          <p className="text-xs text-muted">
            {defenderHero.name} may reveal a shield against the {result.toOpponent} in the next step.
          </p>
          <div className="mt-auto flex gap-2.5">
            <Button className="h-12 flex-1" onClick={confirmStep1}>
              End turn
            </Button>
            <Button variant="ghost" className="h-12 w-28" onClick={cancelAttack}>
              Cancel
            </Button>
          </div>
        </Drawer>
      )}

      {attack && attack.step === 2 && attackerHero && defenderHero && result && (
        <Drawer key="step2" side={defenderSide} color={defenderHero.color}>
          <Label>
            {defenderHero.name} · Incoming · Step 2 of 2
          </Label>
          <h2 className="font-display text-2xl font-bold leading-tight">
            {attackerHero.name} deals {result.toOpponent}. Reveal a shield?
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <Stepper label="Shield" value={attack.shield} onChange={setShield} />
            <Result
              label={`${defenderHero.name} takes`}
              value={result.damage}
              sub={`${defender.health} → ${Math.max(0, defender.health - result.damage)}`}
            />
          </div>
          <p className="text-xs text-muted">
            0 if you have no shield. Validating ends {attackerHero.name}'s turn.
          </p>
          <div className="mt-auto flex gap-2.5">
            <Button variant="ghost" className="h-12 w-28" onClick={backToStep1}>
              Back
            </Button>
            <Button className="h-12 flex-1" onClick={validateShield}>
              Validate shield
            </Button>
          </div>
        </Drawer>
      )}
    </AnimatePresence>
  )
}

function Drawer({ side, color, children }: { side: 'left' | 'right'; color: string; children: React.ReactNode }) {
  const fromX = side === 'left' ? '-100%' : '100%'
  return (
    <motion.aside
      className={`absolute top-0 bottom-0 z-30 flex w-[52%] min-w-[360px] max-w-[520px] flex-col gap-3 bg-panel p-5 shadow-2xl ${side === 'left' ? 'left-0 border-r' : 'right-0 border-l'} border-line`}
      style={{ [side === 'left' ? 'borderLeft' : 'borderRight']: `8px solid ${color}` }}
      initial={{ x: fromX }}
      animate={{ x: 0 }}
      exit={{ x: fromX }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
    >
      {children}
    </motion.aside>
  )
}

function Stepper({ label, value, onChange, max }: { label: string; value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-panel-2 p-2.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-1.5">
        <Tap className="h-12 w-12" onClick={() => onChange(value - 1)} disabled={value <= 0} aria-label={`${label} minus one`}>
          −
        </Tap>
        <span className="flex-1 text-center font-display text-4xl font-bold tabular-nums">{value}</span>
        <Tap className="h-12 w-12" onClick={() => onChange(value + 1)} disabled={max !== undefined && value >= max} aria-label={`${label} plus one`}>
          +
        </Tap>
      </div>
    </div>
  )
}

function Result({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-paper p-2.5 text-ink">
      <Label className="text-ink/60">{label}</Label>
      <span className="flex flex-1 items-center justify-center font-display text-4xl font-bold tabular-nums">{value}</span>
      {sub && <span className="text-center font-display text-xs font-bold tabular-nums">{sub}</span>}
    </div>
  )
}
