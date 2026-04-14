import type { JikanAnime, JikanSearchResponse } from './types'

const JIKAN_BASE = 'https://api.jikan.moe/v4'

export async function searchAnime(query: string): Promise<JikanAnime[]> {
  const url = `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=false`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`)
  const data: JikanSearchResponse = await res.json()
  return data.data ?? []
}
