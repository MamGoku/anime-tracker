export type AnimeStatus = 'watching' | 'completed' | 'dropped' | 'plan_to_watch'

export interface User {
  name: string
  avatar: string
  createdAt: string
}

export interface AnimeEntry {
  id: string
  userId: string
  animeId: number
  title: string
  coverImage: string
  synopsis: string
  status: AnimeStatus
  season?: number
  duration?: string
  episodes?: number
  addedAt: string
}

export interface JikanAnime {
  mal_id: number
  title: string
  title_english: string | null
  synopsis: string | null
  duration: string | null
  images: {
    jpg: {
      image_url: string
      large_image_url: string
    }
  }
  score: number | null
  episodes: number | null
  status: string
}

export interface JikanSearchResponse {
  data: JikanAnime[]
  pagination: {
    has_next_page: boolean
    current_page: number
  }
}

export interface UserWithEntries {
  user: User
  entries: AnimeEntry[]
}

export interface LocalUser {
  name: string
  avatar: string
}

export const STATUS_LABELS: Record<AnimeStatus, string> = {
  watching: 'Schaut gerade',
  completed: 'Fertig',
  dropped: 'Abgebrochen',
  plan_to_watch: 'Möchte schauen',
}

export const STATUS_COLORS: Record<AnimeStatus, string> = {
  watching: 'bg-blue-500 text-white',
  completed: 'bg-green-500 text-white',
  dropped: 'bg-red-500 text-white',
  plan_to_watch: 'bg-yellow-400 text-black',
}

export const VALID_STATUSES: AnimeStatus[] = ['watching', 'completed', 'dropped', 'plan_to_watch']

export const AVATAR_OPTIONS = [
  '🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐸', '🐺',
  '🦄', '🐙', '🦋', '🌸', '⭐', '🔥', '🎭', '🎌',
  '🗡️', '🌙', '⚡', '🎯',
]

/** Parst Jikan-Dauer-Strings wie "24 min per ep", "1 hr 44 min", "23 min" → Minuten als Zahl */
export function parseDurationMinutes(duration: string): number | null {
  const perEp = duration.match(/(\d+)\s*min\s*per\s*ep/i)
  if (perEp) return parseInt(perEp[1])

  const hrMin = duration.match(/(\d+)\s*hr(?:\s*(\d+)\s*min)?/i)
  if (hrMin) return parseInt(hrMin[1]) * 60 + parseInt(hrMin[2] ?? '0')

  const minOnly = duration.match(/^(\d+)\s*min$/i)
  if (minOnly) return parseInt(minOnly[1])

  return null
}
