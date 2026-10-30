import { motion } from 'framer-motion'
import { ActivePanel } from '../components/ActivePanel'
import { AttackDrawer } from '../components/AttackDrawer'
import { GameMenu } from '../components/GameMenu'
import { WaitingPanel } from '../components/WaitingPanel'
import { useGame } from '../store/gameStore'

export function Board() {
  const players = useGame((s) => s.players)
  const active = useGame((s) => s.active)

  const panels = [0, 1].map((i) => {
    const isActive = i === active
    return (
      <motion.div
        key={i}
        layout
        className={`relative h-full overflow-hidden ${i === 0 ? 'border-r border-line' : ''}`}
        initial={false}
        animate={{ flexBasis: isActive ? '80%' : '20%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 32 }}
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {isActive ? <ActivePanel index={i as 0 | 1} player={players[i]} /> : <WaitingPanel player={players[i]} />}
      </motion.div>
    )
  })

  return (
    <div className="relative flex h-full">
      {panels}
      <GameMenu />
      <AttackDrawer />
    </div>
  )
}
