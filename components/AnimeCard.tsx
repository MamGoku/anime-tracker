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
  const [statusLoading, setStatusLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleCycleStatus() {
    const currentIndex = STATUS_CYCLE.indexOf(entry.status)
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
    setStatusLoading(true)
    await onStatusChange(entry.id, nextStatus)
    setStatusLoading(false)
  }

  async function handleDelete() {
    setDeleteLoading(true)
    await onDelete(entry.id)
    setDeleteLoading(false)
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
          <div className="flex items-center gap-1.5 mt-1">
            <StatusBadge status={entry.status} />
            {(entry.season ?? 1) > 1 && (
              <span className="text-xs font-semibold bg-white/20 text-white rounded px-1 leading-tight">
                S{entry.season}
              </span>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
            <button
              onClick={handleCycleStatus}
              disabled={statusLoading || deleteLoading}
              title={`Status wechseln (aktuell: ${STATUS_LABELS[entry.status]})`}
              aria-label={`Status wechseln, aktuell: ${STATUS_LABELS[entry.status]}`}
              className="bg-black/70 hover:bg-black rounded p-1 text-white disabled:opacity-50"
            >
              {statusLoading
                ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <RefreshCw size={12} aria-hidden="true" />
              }
            </button>
            <button
              onClick={handleDelete}
              disabled={statusLoading || deleteLoading}
              title="Eintrag löschen"
              aria-label={`${entry.title} löschen`}
              className="bg-black/70 hover:bg-red-600 rounded p-1 text-white disabled:opacity-50"
            >
              {deleteLoading
                ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <Trash2 size={12} aria-hidden="true" />
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
