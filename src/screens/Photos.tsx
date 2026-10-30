import { useRef, useState } from 'react'
import { HEROES } from '../game/heroes'
import type { HeroId } from '../game/types'
import { useGame } from '../store/gameStore'
import { usePhotos } from '../store/photoStore'
import { HeroArt } from '../components/HeroArt'
import { Button, Label } from '../components/ui'

/** Import a photo of each Shard Master card from this phone. Photos stay on the device. */
export function Photos() {
  const goHome = useGame((s) => s.goHome)
  const urls = usePhotos((s) => s.urls)
  const count = Object.keys(urls).length

  return (
    <div className="flex h-full flex-col gap-3 px-6 py-4">
      <header className="flex items-center gap-4">
        <div className="flex flex-1 flex-col">
          <h1 className="font-display text-2xl font-bold">Hero photos</h1>
          <p className="text-sm text-muted">
            Take or pick a photo of each card. Photos stay on this phone only. {count}/5 set.
          </p>
        </div>
        <Button variant="secondary" className="h-11 w-32" onClick={goHome}>
          Done
        </Button>
      </header>

      <div className="flex flex-1 items-center justify-center gap-3">
        {HEROES.map((h) => (
          <Slot key={h.id} id={h.id} name={h.name} color={h.color} hasPhoto={!!urls[h.id]} />
        ))}
      </div>
    </div>
  )
}

function Slot({ id, name, color, hasPhoto }: { id: HeroId; name: string; color: string; hasPhoto: boolean }) {
  const setPhoto = usePhotos((s) => s.setPhoto)
  const removePhoto = usePhotos((s) => s.removePhoto)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      await setPhoto(id, file)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex w-36 flex-col gap-2">
      <div className="relative h-48 overflow-hidden rounded-xl border-2" style={{ borderColor: color }}>
        <HeroArt hero={id} className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-2">
          <span className="font-display text-sm font-bold uppercase tracking-wider">{name}</span>
          <Label className="text-[8px] text-paper/70">{hasPhoto ? 'Photo set' : 'Colour only'}</Label>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
        aria-label={`Choose a photo for ${name}`}
      />
      <Button variant="secondary" className="h-10 text-[11px]" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Saving…' : hasPhoto ? 'Replace' : 'Choose photo'}
      </Button>
      {hasPhoto && (
        <Button variant="ghost" className="h-8 text-[10px]" onClick={() => void removePhoto(id)}>
          Remove
        </Button>
      )}
    </div>
  )
}
