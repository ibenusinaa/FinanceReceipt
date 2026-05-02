import { db } from '../db/index'
import { receiptSequences } from '../db/schema'
import { and, eq, sql } from 'drizzle-orm'

export async function generateReceiptNumber(bank: string): Promise<string> {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(receiptSequences)
      .where(and(eq(receiptSequences.bank, bank as any), eq(receiptSequences.date, today as any)))
      .limit(1)

    let seq: number
    if (existing) {
      seq = existing.currentSequence + 1
      await tx
        .update(receiptSequences)
        .set({ currentSequence: seq })
        .where(eq(receiptSequences.id, existing.id))
    } else {
      seq = 1
      await tx.insert(receiptSequences).values({
        bank: bank as any,
        date: today as any,
        currentSequence: 1,
      })
    }

    const padded = String(seq).padStart(3, '0')
    const dateStr = today.replace(/-/g, '')
    return `${bank}-${dateStr}-${padded}`
  })
}
