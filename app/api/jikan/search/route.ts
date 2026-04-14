import type { NextRequest } from 'next/server'
import { searchAnime } from '@/lib/jikan'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.trim().length < 2) {
    return Response.json({ results: [] })
  }
  try {
    const results = await searchAnime(q)
    return Response.json({ results })
  } catch {
    return Response.json({ results: [] }, { status: 502 })
  }
}
