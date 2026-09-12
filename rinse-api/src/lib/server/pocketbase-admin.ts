import PocketBase from 'pocketbase'

let adminPb: PocketBase | null = null

export function getServerPocketBase(): PocketBase | null {
  const url = process.env.PB_URL ?? process.env.NEXT_PUBLIC_PB_URL
  if (!url) return null

  if (!adminPb) {
    adminPb = new PocketBase(url)
    adminPb.autoCancellation(false)
  }
  return adminPb
}

export async function authenticateServerPocketBase(): Promise<PocketBase> {
  const pb = getServerPocketBase()
  if (!pb) throw new Error('PocketBase URL not configured')

  if (pb.authStore.isValid) return pb

  const email = process.env.PB_EMAIL ?? process.env.NEXT_PUBLIC_PB_EMAIL
  const password = process.env.PB_PASSWORD ?? process.env.NEXT_PUBLIC_PB_PASSWORD

  if (!email || !password) {
    throw new Error('PocketBase credentials not configured (PB_EMAIL / PB_PASSWORD)')
  }

  await pb.collection('users').authWithPassword(email, password)
  return pb
}

/** Superuser auth — required for creating organizations and cross-tenant admin tasks. */
export async function authenticateServerAdmin(): Promise<PocketBase> {
  const pb = getServerPocketBase()
  if (!pb) throw new Error('PocketBase URL not configured')

  const adminEmail = process.env.PB_ADMIN_EMAIL
  const adminPassword = process.env.PB_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error('PocketBase admin not configured (PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD)')
  }

  await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword)
  return pb
}

export async function fetchCollection<T = Record<string, unknown>>(
  name: string
): Promise<T[]> {
  const pb = await authenticateServerPocketBase()
  return pb.collection(name).getFullList<T>({ sort: '-id' })
}
