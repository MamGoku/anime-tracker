'use client'

import Image from 'next/image'
import { Trash2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { AnimeEntry, AnimeStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'
import StatusBadge from './StatusBadge'

interface AnimeCardProps {
  entry: AnimeEntry
  isOwner: boolean
  onStatusChange: (id: string, status: AnimeStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const STATUS_CYCLE: AnimeStatus[] = ['plan_to_watch', 'watching', 'completed', 'dropped']

export default function AnimeCard({ entry, isOwner, onStatusChange, onDelete }: AnimeCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleCycleStatus() {
    const currentIndex = STATUS_CYCLE.indexOf(entry.status)
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
    setLoading(true)
    await onStatusChange(entry.id, nextStatus)
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    await onDelete(entry.id)
    setLoading(false)
  }

  return (
    <div className="group relative w-36 flex-shrink-0">
      <div className="relative w-36 h-52 rounded-lg overflow-hidden bg-neutral-800">
        {entry.coverImage ? (
          <Image
            src={entry.coverImage}
            alt={entry.title}
            fill
            className="object-cover"
            sizes="144px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500 text-4xl">
            🎌
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{entry.title}</p>
          <StatusBadge status={entry.status} className="mt-1" />
        </div>

        {isOwner && !loading && (
          <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCycleStatus}
              title={`Status wechseln (aktuell: ${STATUS_LABELS[entry.status]})`}
              className="bg-black/70 hover:bg-black rounded p-1 text-white"
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={handleDelete}
              title="Eintrag löschen"
              className="bg-black/70 hover:bg-red-600 rounded p-1 text-white"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
