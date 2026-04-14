'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AVATAR_OPTIONS } from '@/lib/types'
import type { LocalUser } from '@/lib/types'

interface OnboardingModalProps {
  open: boolean
  onComplete: (user: LocalUser) => void
}

export default function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) { setError('Bitte gib einen Namen ein'); return }
    if (trimmed.length > 30) { setError('Name zu lang (max. 30 Zeichen)'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed, avatar: selectedAvatar }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Erstellen des Profils')
      setLoading(false)
      return
    }

    const localUser: LocalUser = { name: trimmed, avatar: selectedAvatar }
    localStorage.setItem('anime-tracker-user', JSON.stringify(localUser))
    onComplete(localUser)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Willkommen beim Anime Tracker 🎌</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Dein Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. max"
              maxLength={30}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Wähle einen Avatar</label>
            <div className="grid grid-cols-10 gap-1">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`text-xl p-1 rounded transition-colors ${
                    selectedAvatar === emoji
                      ? 'bg-neutral-200 dark:bg-neutral-700 ring-2 ring-blue-500'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Wird erstellt…' : 'Los geht\'s'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
