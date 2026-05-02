import { Elysia, t } from 'elysia'
import { db } from '../db/index'
import { transactions, clients, transactionHeaders } from '../db/schema'
import { eq, or, like, sql } from 'drizzle-orm'

export const mappingRoutes = new Elysia()
  .get('/api/clients/search', async ({ query }) => {
    const q = (query.q || '').trim()
    if (q.length < 2) return []

    return await db
      .select({
        id: clients.id,
        clientCode: clients.clientCode,
        clientName: clients.clientName,
        bankAccountNo: clients.bankAccountNo,
        bankName: clients.bankName,
      })
      .from(clients)
      .where(
        or(
          like(clients.clientName, `%${q}%`),
          like(clients.clientCode, `%${q}%`),
        ),
      )
      .limit(20)
  })
  .post('/transactions/assign-batch', async ({ body, set }) => {
    const assignments = body.assignments
    if (!assignments || assignments.length === 0) {
      set.status = 400
      return { error: 'No assignments provided' }
    }

    await db.transaction(async (tx) => {
      const headerIds = new Set<number>()

      for (const { txId, clientId } of assignments) {
        const [txr] = await tx
          .select({ headerId: transactions.headerId, status: transactions.status })
          .from(transactions)
          .where(eq(transactions.id, txId))
          .limit(1)

        if (!txr || txr.status === 'Receipt Generated') continue

        await tx
          .update(transactions)
          .set({
            clientId,
            status: txr.status === 'Unmapped' ? 'Mapped' as const : txr.status,
          })
          .where(eq(transactions.id, txId))

        headerIds.add(txr.headerId)
      }

      for (const headerId of headerIds) {
        const [counts] = await tx
          .select({
            mapped: sql<number>`count(case when status = 'Mapped' then 1 end)`,
            unmapped: sql<number>`count(case when status = 'Unmapped' then 1 end)`,
          })
          .from(transactions)
          .where(eq(transactions.headerId, headerId))

        await tx
          .update(transactionHeaders)
          .set({ mappedCount: counts?.mapped ?? 0, unmappedCount: counts?.unmapped ?? 0 })
          .where(eq(transactionHeaders.id, headerId))
      }
    })

    return { success: true, updated: assignments.length }
  }, {
    body: t.Object({
      assignments: t.Array(t.Object({
        txId: t.Number(),
        clientId: t.Number(),
      })),
    }),
  })
