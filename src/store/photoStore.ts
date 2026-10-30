import { create } from 'zustand'
import type { HeroId } from '../game/types'
import { downscale, photoDb } from './photoDb'

interface PhotoState {
  /** Object URLs for the photos stored on this device, by hero. */
  urls: Partial<Record<HeroId, string>>
  loaded: boolean
  load: () => Promise<void>
  setPhoto: (id: HeroId, file: Blob) => Promise<void>
  removePhoto: (id: HeroId) => Promise<void>
}

export const usePhotos = create<PhotoState>()((set, get) => ({
  urls: {},
  loaded: false,

  load: async () => {
    if (get().loaded || typeof indexedDB === 'undefined') return
    try {
      const blobs = await photoDb.all()
      const urls: Partial<Record<HeroId, string>> = {}
      for (const [id, blob] of Object.entries(blobs)) {
        if (blob) urls[id as HeroId] = URL.createObjectURL(blob)
      }
      set({ urls, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  setPhoto: async (id, file) => {
    const blob = await downscale(file)
    await photoDb.set(id, blob)
    const prev = get().urls[id]
    if (prev) URL.revokeObjectURL(prev)
    set({ urls: { ...get().urls, [id]: URL.createObjectURL(blob) } })
  },

  removePhoto: async (id) => {
    await photoDb.remove(id)
    const prev = get().urls[id]
    if (prev) URL.revokeObjectURL(prev)
    const urls = { ...get().urls }
    delete urls[id]
    set({ urls })
  },
}))

if (import.meta.env.DEV) {
  ;(window as unknown as { photos: typeof usePhotos }).photos = usePhotos
}
