import { Elysia } from 'elysia'
import { lucia } from '../lib/lucia'

function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
}

export const auth = new Elysia({ name: 'auth' })
  .derive({ as: 'global' }, async ({ request, set }) => {
    const cookieHeader = request.headers.get('Cookie')
    const sessionId = getCookie(cookieHeader, lucia.sessionCookieName)

    if (!sessionId) {
      return { user: null, session: null }
    }

    const { session, user } = await lucia.validateSession(sessionId)

    if (!session) {
      set.headers['Set-Cookie'] = lucia.createBlankSessionCookie().serialize()
      return { user: null, session: null }
    }

    if (session.fresh) {
      set.headers['Set-Cookie'] = lucia.createSessionCookie(session.id).serialize()
    }

    return { user, session }
  })
