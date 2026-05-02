import { Elysia } from 'elysia'
import { html } from '@elysiajs/html'
import { auth } from './middleware/auth'
import { authRoutes } from './routes/auth'

const app = new Elysia()
  .use(html())
  .use(auth)
  .use(authRoutes)
  .get('/', ({ user, set }) => {
    if (!user) {
      set.status = 302
      set.headers['Location'] = '/auth/login'
      return ''
    }
    return `<p>Welcome, ${user.username}!</p>`
  })
  .listen(3000)

console.log(`Server running at http://localhost:3000`)
