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

interface AddAnimeModalProps {
  open: boolean
  onClose: () => void
  onAdd: () => Promise<void>
  currentUser: LocalUser
}

export default function AddAnimeModal({ open, onClose, onAdd, currentUser }: AddAnimeModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JikanAnime[]>([])
  const [selected, setSelected] = useState<JikanAnime | null>(null)
  const [status, setStatus] = useState<AnimeStatus>('plan_to_watch')
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
    setSelected(null)
    setStatus('plan_to_watch')
    setError('')
    onClose()
  }

  async function handleAdd() {
    if (!selected) return
    setAdding(true)
    setError('')

    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.name,
        animeId: selected.mal_id,
        title: selected.title_english ?? selected.title,
        coverImage: selected.images.jpg.image_url,
        synopsis: selected.synopsis ?? '',
        status,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Fehler beim Hinzufügen')
      setAdding(false)
      return
    }

    handleClose()
    await onAdd()
    setAdding(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
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

          {results.length > 0 && !selected && (
            <ul role="listbox" aria-label="Suchergebnisse" className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-1">
              {results.map((anime) => (
                <li key={anime.mal_id} role="option" aria-selected={false}>
                  <button
                    onClick={() => setSelected(anime)}
                    className="w-full flex items-center gap-3 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                  >
                    {anime.images.jpg.image_url && (
                      <Image
                        src={anime.images.jpg.image_url}
                        alt=""
                        width={32}
                        height={44}
                        className="rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {anime.title_english ?? anime.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {anime.episodes ? `${anime.episodes} Folgen` : 'Laufend'}{anime.score ? ` · ⭐ ${anime.score}` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <div className="flex gap-3 p-3 border rounded-md bg-neutral-50 dark:bg-neutral-900">
              {selected.images.jpg.image_url && (
                <Image
                  src={selected.images.jpg.image_url}
                  alt={selected.title_english ?? selected.title}
                  width={48}
                  height={68}
                  className="rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selected.title_english ?? selected.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{selected.synopsis}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Auswahl aufheben"
                className="text-neutral-400 hover:text-neutral-600 flex-shrink-0"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {selected && (
            <div>
              <label htmlFor="anime-status" className="block text-sm font-medium mb-1">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as AnimeStatus)}>
                <SelectTrigger id="anime-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [AnimeStatus, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={adding}>Abbrechen</Button>
            <Button onClick={handleAdd} disabled={!selected || adding}>
              {adding ? 'Wird hinzugefügt…' : 'Hinzufügen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
