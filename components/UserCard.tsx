'use client'

import type { AnimeEntry, AnimeStatus, User } from '@/lib/types'
import { parseDurationMinutes } from '@/lib/types'
import AnimeCard from './AnimeCard'

interface UserCardProps {
  user: User
  entries: AnimeEntry[]
  isCurrentUser: boolean
  onStatusChange: (id: string, status: AnimeStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function UserCard({
  user,
  entries,
  isCurrentUser,
  onStatusChange,
  onDelete,
}: UserCardProps) {
  const completedMinutes = entries
    .filter((e) => e.status === 'completed')
    .reduce((sum, e) => {
      if (!e.duration || !e.episodes) return sum
      const mins = parseDurationMinutes(e.duration)
      if (!mins) return sum
      return sum + mins * e.episodes * (e.season ?? 1)
    }, 0)
  const completedHours = completedMinutes > 0
    ? completedMinutes < 60
      ? `${completedMinutes}min`
      : `~${Math.round(completedMinutes / 60)}h`
    : null
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{user.avatar}</span>
        <h2 className="text-lg font-semibold capitalize">{user.name}</h2>
        {isCurrentUser && (
          <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full">
            Du
          </span>
        )}
        <span className="text-xs text-neutral-500 ml-1">
          {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'}
        </span>
        {completedHours && (
          <span className="text-xs text-neutral-500">· {completedHours} fertig geschaut</span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-neutral-500 text-sm italic">
          {isCurrentUser ? 'Füge deinen ersten Anime hinzu!' : 'Noch keine Einträge'}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {entries.map((entry) => (
            <AnimeCard
              key={entry.id}
              entry={entry}
              isOwner={isCurrentUser}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
