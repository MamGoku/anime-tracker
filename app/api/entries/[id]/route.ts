import { getEntry, updateEntryStatus, deleteEntry } from '@/lib/kv'
import type { AnimeStatus } from '@/lib/types'

const VALID_STATUSES: AnimeStatus[] = ['watching', 'completed', 'dropped', 'plan_to_watch']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { status, userId } = body

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Ungültiger Status' }, { status: 400 })
  }

  const entry = await getEntry(id)
  if (!entry) return Response.json({ error: 'Eintrag nicht gefunden' }, { status: 404 })
  if (entry.userId !== userId) return Response.json({ error: 'Nicht erlaubt' }, { status: 403 })

  await updateEntryStatus(id, status)
  return Response.json({ ok: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { userId } = body

  const entry = await getEntry(id)
  if (!entry) return Response.json({ error: 'Eintrag nicht gefunden' }, { status: 404 })
  if (entry.userId !== userId) return Response.json({ error: 'Nicht erlaubt' }, { status: 403 })

  await deleteEntry(id, userId)
  return Response.json({ ok: true })
}
