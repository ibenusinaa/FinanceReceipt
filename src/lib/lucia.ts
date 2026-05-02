import { Lucia } from 'lucia'
import { DrizzleMySQLAdapter } from '@lucia-auth/adapter-drizzle'
import { db } from '../db/index'
import { sessions, users } from '../db/schema'

const adapter = new DrizzleMySQLAdapter(db, sessions, users)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: false,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
    }
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: { username: string }
  }
}
