import { eq, and } from 'drizzle-orm'
import { transactions, clients, transactionHeaders } from '../db/schema'

export async function autoMapTransactions(
  tx: any,
  headerId: number,
): Promise<{ mapped: number; unmapped: number }> {
  const rows = await tx
    .select({ id: transactions.id, senderAccountNo: transactions.senderAccountNo })
    .from(transactions)
    .where(and(eq(transactions.headerId, headerId), eq(transactions.status, 'Unmapped')))

  for (const row of rows) {
    const [client] = await tx
      .select()
      .from(clients)
      .where(eq(clients.bankAccountNo, row.senderAccountNo))
      .limit(1)

    if (client) {
      await tx
        .update(transactions)
        .set({ clientId: client.id, status: 'Mapped' })
        .where(eq(transactions.id, row.id))
    }
  }

  const mapped = rows.length
  const unmapped = 0

  await tx
    .update(transactionHeaders)
    .set({ mappedCount: mapped, unmappedCount: unmapped })
    .where(eq(transactionHeaders.id, headerId))

  return { mapped, unmapped }
}
