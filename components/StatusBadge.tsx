'use client'

import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import type { AnimeStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: AnimeStatus
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
