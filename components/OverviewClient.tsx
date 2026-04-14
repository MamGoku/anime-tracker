'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OnboardingModal from './OnboardingModal'
import AddAnimeModal from './AddAnimeModal'
import UserCard from './UserCard'
import type { AnimeStatus, LocalUser, UserWithEntries } from '@/lib/types'

interface OverviewClientProps {
  initialData: UserWithEntries[]
}

export default function OverviewClient({ initialData }: OverviewClientProps) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showAddAnime, setShowAddAnime] = useState(false)
  const [data, setData] = useState<UserWithEntries[]>(initialData)

  useEffect(() => {
    const stored = localStorage.getItem('anime-tracker-user')
    if (stored) {
      setCurrentUser(JSON.parse(stored))
    } else {
      setShowOnboarding(true)
    }
  }, [])

  const refresh = useCallback(async () => {
    const res = await fetch('/api/entries')
    const { entries } = await res.json()
    const usersRes = await fetch('/api/users')
    const { users } = await usersRes.json()

    const updated: UserWithEntries[] = users.map((user: { name: string; avatar: string; createdAt: string }) => ({
      user,
      entries: entries.filter((e: { userId: string }) => e.userId === user.name),
    }))
    setData(updated)
  }, [])

  async function handleStatusChange(id: string, status: AnimeStatus) {
    await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, userId: currentUser?.name }),
    })
    await refresh()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/entries/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser?.name }),
    })
    await refresh()
  }

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

  // Sort: current user first, then alphabetically
  const sortedData = [...data].sort((a, b) => {
    if (currentUser && a.user.name === currentUser.name) return -1
    if (currentUser && b.user.name === currentUser.name) return 1
    return a.user.name.localeCompare(b.user.name)
  })

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
                  <Plus size={16} className="mr-1" />
                  Anime hinzufügen
                </Button>
                <button
                  onClick={handleLogout}
                  title="Abmelden"
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {sortedData.length === 0 ? (
          <p className="text-neutral-500 text-center mt-16">
            Noch keine Einträge — füge deinen ersten Anime hinzu!
          </p>
        ) : (
          sortedData.map(({ user, entries }) => (
            <UserCard
              key={user.name}
              user={user}
              entries={entries}
              isCurrentUser={currentUser?.name === user.name}
              onStatusChange={handleStatusChange}
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
            setShowAddAnime(false)
            await refresh()
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
