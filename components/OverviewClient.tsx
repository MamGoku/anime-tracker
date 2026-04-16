'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OnboardingModal from './OnboardingModal'
import AddAnimeModal from './AddAnimeModal'
import UserCard from './UserCard'
import type { AnimeStatus, LocalUser, User, UserWithEntries } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

interface OverviewClientProps {
  initialData: UserWithEntries[]
}

export default function OverviewClient({ initialData }: OverviewClientProps) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showAddAnime, setShowAddAnime] = useState(false)
  const [data, setData] = useState<UserWithEntries[]>(initialData)
  const [refreshError, setRefreshError] = useState('')
  const [activeFilter, setActiveFilter] = useState<AnimeStatus | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('anime-tracker-user')
    if (stored) {
      setCurrentUser(JSON.parse(stored))
    } else {
      setShowOnboarding(true)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [entriesRes, usersRes] = await Promise.all([
        fetch('/api/entries'),
        fetch('/api/users'),
      ])
      if (!entriesRes.ok || !usersRes.ok) throw new Error('Fehler beim Laden')
      const { entries } = await entriesRes.json()
      const { users } = await usersRes.json()
      const updated: UserWithEntries[] = users.map((user: User) => ({
        user,
        entries: entries.filter((e: { userId: string }) => e.userId === user.name),
      }))
      setData(updated)
      setRefreshError('')
    } catch {
      setRefreshError('Daten konnten nicht geladen werden.')
    }
  }, [])

  const handleStatusChange = useCallback(async (id: string, status: AnimeStatus) => {
    const res = await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, userId: currentUser?.name }),
    })
    if (res.ok) await refresh()
  }, [currentUser, refresh])

  const handleSeasonChange = useCallback(async (id: string, season: number) => {
    const res = await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ season, userId: currentUser?.name }),
    })
    if (res.ok) await refresh()
  }, [currentUser, refresh])

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/entries/${id}?userId=${encodeURIComponent(currentUser?.name ?? '')}`, {
      method: 'DELETE',
    })
    if (res.ok) await refresh()
  }, [currentUser, refresh])

  function handleOnboardingComplete(user: LocalUser) {
    setCurrentUser(user)
    setShowOnboarding(false)
    router.refresh()
  }

  function handleLogout() {
    localStorage.removeItem('anime-tracker-user')
    setCurrentUser(null)
    setShowOnboarding(true)
  }

  const sortedData = [...data].sort((a, b) => {
    if (currentUser && a.user.name === currentUser.name) return -1
    if (currentUser && b.user.name === currentUser.name) return 1
    return a.user.name.localeCompare(b.user.name)
  })

  const filteredData = sortedData.map(({ user, entries }) => ({
    user,
    entries: activeFilter ? entries.filter((e) => e.status === activeFilter) : entries,
  }))

  const hasAnyEntries = filteredData.some((d) => d.entries.length > 0)

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎌</span>
            <h1 className="text-xl font-bold">Anime Tracker</h1>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                <span className="text-sm text-neutral-400">
                  {currentUser.avatar} <span className="capitalize">{currentUser.name}</span>
                </span>
                <Button size="sm" onClick={() => setShowAddAnime(true)}>
                  <Plus size={16} className="mr-1" aria-hidden="true" />
                  Anime hinzufügen
                </Button>
                <button
                  onClick={handleLogout}
                  aria-label="Abmelden"
                  title="Abmelden"
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span className="sr-only">Abmelden</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {refreshError && (
          <p className="text-red-400 text-sm mb-4">{refreshError}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeFilter === null
                ? 'bg-neutral-100 text-neutral-900'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            Alle
          </button>
          {(Object.entries(STATUS_LABELS) as [AnimeStatus, string][]).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setActiveFilter(activeFilter === status ? null : status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeFilter === status
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!hasAnyEntries ? (
          <p className="text-neutral-500 text-center mt-16">
            {activeFilter ? `Keine Einträge mit Status "${STATUS_LABELS[activeFilter]}"` : 'Noch keine Einträge — füge deinen ersten Anime hinzu!'}
          </p>
        ) : (
          filteredData.map(({ user, entries }) => (
            <UserCard
              key={user.name}
              user={user}
              entries={entries}
              isCurrentUser={currentUser?.name === user.name}
              onStatusChange={handleStatusChange}
              onSeasonChange={handleSeasonChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </main>

      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {currentUser && (
        <AddAnimeModal
          open={showAddAnime}
          onClose={() => setShowAddAnime(false)}
          onAdd={async () => {
            await refresh()
            setShowAddAnime(false)
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
