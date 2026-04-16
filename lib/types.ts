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
  addedAt: string
}

export interface JikanAnime {
  mal_id: number
  title: string
  title_english: string | null
  synopsis: string | null
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
