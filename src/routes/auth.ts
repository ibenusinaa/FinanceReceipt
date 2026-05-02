import { Elysia, t } from 'elysia'
import { login } from '../lib/auth'
import { lucia } from '../lib/lucia'
import { loginPage } from '../views/login'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .get('/login', () => {
    return loginPage()
  })
  .post('/login', async ({ body, set }) => {
    const result = await login(body.username, body.password)
    if (!result) {
      return loginPage('Invalid username or password')
    }
    set.headers['Set-Cookie'] = result.cookie.serialize()
    set.status = 302
    set.headers['Location'] = '/'
    return ''
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    }),
  })
  .post('/logout', async ({ set }) => {
    set.headers['Set-Cookie'] = lucia.createBlankSessionCookie().serialize()
    set.status = 302
    set.headers['Location'] = '/auth/login'
    return ''
  })
