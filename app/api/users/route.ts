import { getAllUsers, getUser, createUser } from '@/lib/kv'

export async function GET() {
  const users = await getAllUsers()
  return Response.json({ users })
}

export async function POST(request: Request) {
  const body = await request.json()
  const name: string = (body.name ?? '').trim().toLowerCase()
  const avatar: string = body.avatar ?? '🐱'

  if (!name || name.length > 30) {
    return Response.json({ error: 'Name ungültig (1–30 Zeichen)' }, { status: 400 })
  }

  const existing = await getUser(name)
  if (existing) {
    return Response.json({ error: 'Dieser Name ist bereits vergeben' }, { status: 409 })
  }

  const user = await createUser(name, avatar)
  return Response.json({ user }, { status: 201 })
}
