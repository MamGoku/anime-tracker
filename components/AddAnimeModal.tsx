'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_LABELS } from '@/lib/types'
import type { AnimeStatus, JikanAnime, LocalUser } from '@/lib/types'

interface QueueItem {
  anime: JikanAnime
  status: AnimeStatus
  season: number
}

interface AddAnimeModalProps {
  open: boolean
  onClose: () => void
  onAdd: () => Promise<void>
  currentUser: LocalUser
}

export default function AddAnimeModal({ open, onClose, onAdd, currentUser }: AddAnimeModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JikanAnime[]>([])
  const [queue, setQueue] = useState<Map<number, QueueItem>>(new Map())
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/jikan/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleClose() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    setResults([])
    setQueue(new Map())
    setError('')
    onClose()
  }

  function toggleItem(anime: JikanAnime) {
    setQueue(prev => {
      const next = new Map(prev)
      if (next.has(anime.mal_id)) {
        next.delete(anime.mal_id)
      } else {
        next.set(anime.mal_id, { anime, status: 'plan_to_watch', season: 1 })
      }
      return next
    })
  }

  function updateQueueItem(malId: number, patch: Partial<Pick<QueueItem, 'status' | 'season'>>) {
    setQueue(prev => {
      const next = new Map(prev)
      const item = next.get(malId)
      if (item) next.set(malId, { ...item, ...patch })
      return next
    })
  }

  async function handleAdd() {
    if (queue.size === 0) return
    setAdding(true)
    setError('')

    const items = Array.from(queue.values())
    const responses = await Promise.allSettled(
      items.map(({ anime, status, season }) =>
        fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.name,
            animeId: anime.mal_id,
            title: anime.title_english ?? anime.title,
            coverImage: anime.images.jpg.image_url,
            synopsis: anime.synopsis ?? '',
            status,
            season,
            duration: anime.duration ?? undefined,
            episodes: anime.episodes ?? undefined,
          }),
        })
      )
    )

    const failed = responses.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok))
    if (failed.length > 0) {
      setError(`${failed.length} Einträge konnten nicht hinzugefügt werden.`)
    }

    setQueue(new Map())
    await onAdd()
    setAdding(false)
  }

  const queueItems = Array.from(queue.values())

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Anime hinzufügen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            id="anime-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Anime suchen…"
            autoFocus
            aria-label="Anime suchen"
          />

          {searching && (
            <p className="text-sm text-neutral-500 text-center" aria-live="polite">Suche läuft…</p>
          )}

          {results.length > 0 && (
            <ul role="listbox" aria-label="Suchergebnisse" className="max-h-56 overflow-y-auto space-y-0.5 border rounded-md p-1">
              {results.map((anime) => {
                const checked = queue.has(anime.mal_id)
                return (
                  <li key={anime.mal_id} role="option" aria-selected={checked}>
                    <label className="flex items-center gap-3 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(anime)}
                        aria-label={`${anime.title_english ?? anime.title} auswählen`}
                        className="rounded flex-shrink-0"
                      />
                      {anime.images.jpg.image_url && (
                        <Image
                          src={anime.images.jpg.image_url}
                          alt=""
                          width={32}
                          height={44}
                          className="rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {anime.title_english ?? anime.title}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {anime.episodes ? `${anime.episodes} Folgen` : 'Laufend'}{anime.score ? ` · ⭐ ${anime.score}` : ''}
                        </p>
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}

          {queueItems.length > 0 && (
            <>
              <hr className="border-neutral-800" />
              <div>
                <p className="text-xs text-neutral-500 mb-2">Ausgewählt ({queueItems.length})</p>
                <ul className="max-h-52 overflow-y-auto space-y-2">
                  {queueItems.map((item) => (
                    <li key={item.anime.mal_id} className="flex items-center gap-2">
                      {item.anime.images.jpg.image_url && (
                        <Image
                          src={item.anime.images.jpg.image_url}
                          alt=""
                          width={28}
                          height={40}
                          className="rounded object-cover flex-shrink-0"
                        />
                      )}
                      <p className="text-sm truncate flex-1 min-w-0">
                        {item.anime.title_english ?? item.anime.title}
                      </p>
                      <Select
                        value={item.status}
                        onValueChange={(v) => updateQueueItem(item.anime.mal_id, { status: v as AnimeStatus })}
                      >
                        <SelectTrigger className="w-36 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(STATUS_LABELS) as [AnimeStatus, string][]).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        value={item.season}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value))
                          updateQueueItem(item.anime.mal_id, { season: v })
                        }}
                        aria-label="Staffel"
                        className="w-16 h-7 text-xs text-center"
                      />
                      <button
                        onClick={() => toggleItem(item.anime)}
                        aria-label={`${item.anime.title_english ?? item.anime.title} entfernen`}
                        className="text-neutral-400 hover:text-neutral-200 flex-shrink-0"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={queue.size === 0 || adding}>
              {adding ? 'Wird hinzugefügt…' : `Hinzufügen${queue.size > 0 ? ` (${queue.size})` : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
