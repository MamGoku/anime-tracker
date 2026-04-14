import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'
import type { User, AnimeEntry, AnimeStatus } from './types'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// --- User operations ---

export async function getAllUsers(): Promise<User[]> {
  const names = await redis.smembers('users')
  if (names.length === 0) return []

  const pipeline = redis.pipeline()
  for (const name of names) {
    pipeline.hgetall(`user:${name}`)
  }
  const results = await pipeline.exec()
  return (results as (User | null)[]).filter((u): u is User => u !== null)
}

export async function getUser(name: string): Promise<User | null> {
  const data = await redis.hgetall(`user:${name}`)
  if (!data || Object.keys(data).length === 0) return null
  return data as unknown as User
}

export async function createUser(name: string, avatar: string): Promise<User> {
  const user: User = { name, avatar, createdAt: new Date().toISOString() }
  const pipeline = redis.pipeline()
  pipeline.sadd('users', name)
  pipeline.hset(`user:${name}`, user as unknown as Record<string, unknown>)
  await pipeline.exec()
  return user
}

// --- Entry operations ---

export async function getUserEntries(userId: string): Promise<AnimeEntry[]> {
  const ids = await redis.lrange(`user:${userId}:entries`, 0, 49)
  if (ids.length === 0) return []

  const pipeline = redis.pipeline()
  for (const id of ids) {
    pipeline.hgetall(`entry:${id}`)
  }
  const results = await pipeline.exec()
  return (results as (AnimeEntry | null)[])
    .filter((e): e is AnimeEntry => e !== null)
    .map((e) => ({ ...e, animeId: Number(e.animeId) }))
}

export async function getAllEntries(): Promise<AnimeEntry[]> {
  const users = await getAllUsers()
  const allEntries = await Promise.all(users.map((u) => getUserEntries(u.name)))
  return allEntries.flat()
}

export async function createEntry(
  data: Omit<AnimeEntry, 'id' | 'addedAt'>
): Promise<AnimeEntry> {
  const entry: AnimeEntry = {
    ...data,
    id: uuidv4(),
    addedAt: new Date().toISOString(),
  }
  const pipeline = redis.pipeline()
  pipeline.lpush(`user:${data.userId}:entries`, entry.id)
  pipeline.hset(`entry:${entry.id}`, entry as unknown as Record<string, unknown>)
  await pipeline.exec()
  return entry
}

export async function updateEntryStatus(id: string, status: AnimeStatus): Promise<void> {
  await redis.hset(`entry:${id}`, { status })
}

export async function deleteEntry(id: string, userId: string): Promise<void> {
  const pipeline = redis.pipeline()
  pipeline.lrem(`user:${userId}:entries`, 0, id)
  pipeline.del(`entry:${id}`)
  await pipeline.exec()
}

export async function getEntry(id: string): Promise<AnimeEntry | null> {
  const data = await redis.hgetall(`entry:${id}`)
  if (!data || Object.keys(data).length === 0) return null
  return { ...(data as unknown as AnimeEntry), animeId: Number((data as unknown as AnimeEntry).animeId) }
}
