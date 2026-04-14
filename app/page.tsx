import { getAllUsers, getUserEntries } from '@/lib/kv'
import OverviewClient from '@/components/OverviewClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const users = await getAllUsers()
  const usersWithEntries = await Promise.all(
    users.map(async (user) => ({
      user,
      entries: await getUserEntries(user.name),
    }))
  )

  return <OverviewClient initialData={usersWithEntries} />
}
