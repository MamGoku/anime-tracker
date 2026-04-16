import { getEntry, updateEntryStatus, deleteEntry } from '@/lib/kv'
import { VALID_STATUSES } from '@/lib/types'
import type { AnimeStatus } from '@/lib/types'
import type { NextRequest } from 'next/server'

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.nextUrl.searchParams.get('userId')

  if (!userId) return Response.json({ error: 'userId fehlt' }, { status: 400 })

  const entry = await getEntry(id)
  if (!entry) return Response.json({ error: 'Eintrag nicht gefunden' }, { status: 404 })
  if (entry.userId !== userId) return Response.json({ error: 'Nicht erlaubt' }, { status: 403 })

  await deleteEntry(id, userId)
  return Response.json({ ok: true })
}
