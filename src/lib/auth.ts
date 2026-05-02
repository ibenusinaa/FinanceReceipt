import { lucia } from './lucia'
import { db } from '../db/index'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function login(username: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
  if (!user) return null

  const valid = await Bun.password.verify(password, user.passwordHash)
  if (!valid) return null

  const session = await lucia.createSession(user.id, {})
  const cookie = lucia.createSessionCookie(session.id)
  return { user, cookie }
}
