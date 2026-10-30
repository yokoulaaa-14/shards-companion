import type { HeroId } from '../game/types'

/**
 * Hero photos live only on the device, in IndexedDB. They are never uploaded
 * or committed: the card artwork belongs to the publisher.
 */
const DB_NAME = 'shards-companion'
const STORE = 'hero-photos'
const MAX_EDGE = 900
const JPEG_QUALITY = 0.85

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      }),
  )
}

export const photoDb = {
  get: (id: HeroId) => tx<Blob | undefined>('readonly', (s) => s.get(id)),
  set: (id: HeroId, blob: Blob) => tx('readwrite', (s) => s.put(blob, id)),
  remove: (id: HeroId) => tx('readwrite', (s) => s.delete(id)),
  async all(): Promise<Partial<Record<HeroId, Blob>>> {
    const keys = await tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys())
    const values = await tx<Blob[]>('readonly', (s) => s.getAll())
    const out: Partial<Record<HeroId, Blob>> = {}
    keys.forEach((k, i) => {
      out[k as HeroId] = values[i]
    })
    return out
  },
}

/** Downscale a picked image to card size so five photos stay small on disk. */
export async function downscale(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', JPEG_QUALITY))
}
