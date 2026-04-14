import type { NextRequest } from 'next/server'
import { getAllEntries, getUserEntries, createEntry, getUser } from '@/lib/kv'
import type { AnimeStatus } from '@/lib/types'

const VALID_STATUSES: AnimeStatus[] = ['watching', 'completed', 'dropped', 'plan_to_watch']

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (userId) {
    const entries = await getUserEntries(userId)
    return Response.json({ entries })
  }
  const entries = await getAllEntries()
  return Response.json({ entries })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { userId, animeId, title, coverImage, synopsis, status } = body

  if (!userId || !animeId || !title || !status) {
    return Response.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
  }

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Ungültiger Status' }, { status: 400 })
  }

  const user = await getUser(userId)
  if (!user) {
    return Response.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })
  }

  const entry = await createEntry({
    userId,
    animeId: Number(animeId),
    title,
    coverImage: coverImage ?? '',
    synopsis: synopsis ? String(synopsis).slice(0, 200) : '',
    status,
  })

  return Response.json({ entry }, { status: 201 })
}
