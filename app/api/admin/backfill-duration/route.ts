import { getAllEntries } from '@/lib/kv'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const JIKAN_BASE = 'https://api.jikan.moe/v4'
const DELAY_MS = 400 // Jikan: max ~3 req/s
// Sentinel: Einträge die wir versucht haben aber keine Daten hatten,
// damit sie nicht bei jedem Aufruf erneut abgefragt werden
const UNKNOWN = 'unknown'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST() {
  const entries = await getAllEntries()
  // Einträge ohne duration/episodes UND ohne bereits gesetztes Sentinel
  const toUpdate = entries.filter(
    (e) => (!e.duration || !e.episodes) && e.duration !== UNKNOWN
  )

  if (toUpdate.length === 0) {
    return Response.json({ message: 'Alle Einträge bereits vollständig.', updated: 0 })
  }

  let updated = 0
  let failed = 0
  let unavailable = 0

  for (const entry of toUpdate) {
    try {
      const res = await fetch(`${JIKAN_BASE}/anime/${entry.animeId}`)
      if (!res.ok) { failed++; await sleep(DELAY_MS); continue }

      const data = await res.json()
      const anime = data.data
      const duration: string | undefined = anime.duration && anime.duration !== 'Unknown'
        ? anime.duration
        : undefined
      const episodes: number | undefined = anime.episodes ?? undefined

      if (!duration && !episodes) {
        // Keine Daten verfügbar (laufende Serie o.ä.) — Sentinel setzen
        await redis.hset(`entry:${entry.id}`, { duration: UNKNOWN })
        unavailable++
        await sleep(DELAY_MS)
        continue
      }

      const patch: Record<string, unknown> = {}
      if (duration) patch.duration = duration
      if (episodes) patch.episodes = episodes

      await redis.hset(`entry:${entry.id}`, patch)
      updated++
    } catch {
      failed++
    }

    await sleep(DELAY_MS)
  }

  return Response.json({
    message: `Backfill abgeschlossen.`,
    total: toUpdate.length,
    updated,
    unavailable,
    failed,
    remaining: failed, // failed = nochmal versuchen
  })
}
