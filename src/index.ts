import { Elysia } from 'elysia'
import { html } from '@elysiajs/html'
import { auth } from './middleware/auth'
import { authRoutes } from './routes/auth'
import { transactionRoutes } from './routes/transactions'
import { uploadRoutes } from './routes/upload'
import { mappingRoutes } from './routes/mapping'
import { receiptRoutes } from './routes/receipt'

const app = new Elysia()
  .use(html())
  .use(auth)
  .use(authRoutes)
  .guard({
    beforeHandle({ user, set }) {
      if (!user) {
        set.status = 302
        set.headers['Location'] = '/auth/login'
        return ''
      }
    },
  }, (app) => app
    .use(transactionRoutes)
    .use(uploadRoutes)
    .use(mappingRoutes)
    .use(receiptRoutes)
  )
  .listen(3000)

console.log(`Server running at http://localhost:3000`)
