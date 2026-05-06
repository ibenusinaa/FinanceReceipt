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
  .onError(({ code, error, set, request }) => {
    console.error(`[${code}]`, error instanceof Error ? error.message : error)
    const isHtmx = request.headers.get('HX-Request') === 'true'
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    if (isHtmx) {
      set.headers['HX-Trigger'] = JSON.stringify({ showToast: { message, type: 'error' } })
      return ''
    }
    set.status = 500
    return 'Internal server error'
  })
  .listen(process.env.PORT || 3000)

console.log(`Server running at http://localhost:3000`)
