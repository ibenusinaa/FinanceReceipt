import { Elysia } from 'elysia'
import { db } from '../db/index'
import { transactions, clients, transactionHeaders, receiptFiles } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { generateReceiptNumber } from '../services/receipt'
import { generateReceiptPdf } from '../services/pdf'

export const receiptRoutes = new Elysia()
  .post('/receipts/:id/generate', async ({ params, set, ...ctx }) => {
    const user = (ctx as any).user
    const txId = parseInt(params.id, 10)
    if (isNaN(txId)) {
      set.status = 400
      return { error: 'Invalid transaction ID' }
    }

    const [tx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, txId))
      .limit(1)

    if (!tx) {
      set.status = 404
      return { error: 'Transaction not found' }
    }

    if (tx.receiptNo) {
      const [existingFile] = await db
        .select()
        .from(receiptFiles)
        .where(eq(receiptFiles.transactionId, txId))
        .limit(1)
      if (existingFile) {
        return new Response(existingFile.pdfBlob, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="receipt-${tx.receiptNo}.pdf"`,
          },
        })
      }
    }

    if (tx.status !== 'Mapped') {
      set.status = 400
      return { error: 'Receipt can only be generated for mapped transactions' }
    }

    const [header] = await db
      .select()
      .from(transactionHeaders)
      .where(eq(transactionHeaders.id, tx.headerId))
      .limit(1)

    if (!header) {
      set.status = 500
      return { error: 'Header not found' }
    }

    const receiptNo = await generateReceiptNumber(header.bank)

    const [client] = tx.clientId
      ? await db.select().from(clients).where(eq(clients.id, tx.clientId)).limit(1)
      : [null]

    const today = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })

    const pdf = await generateReceiptPdf({
      receiptNo,
      receiptDate: today,
      clientName: client?.clientName || 'N/A',
      transactionNo: tx.transactionNo,
      bank: header.bank,
      transactionDate: tx.transactionDate instanceof Date
        ? tx.transactionDate.toLocaleDateString('id-ID')
        : String(tx.transactionDate),
      amount: String(tx.amount),
      senderAccountNo: tx.senderAccountNo,
      senderName: tx.senderName,
    })

    await db.transaction(async (txDb) => {
      await txDb
        .update(transactions)
        .set({ receiptNo, status: 'Receipt Generated' as const, generatedBy: user.username, generatedAt: new Date() })
        .where(eq(transactions.id, txId))

      await txDb.insert(receiptFiles).values({
        transactionId: txId,
        pdfBlob: pdf,
      })

      const [remaining] = await txDb
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(sql`header_id = ${tx.headerId} AND status != 'Receipt Generated'`)

      if (Number(remaining?.count) === 0) {
        await txDb
          .update(transactionHeaders)
          .set({ status: 'Receipt Generated' })
          .where(eq(transactionHeaders.id, tx.headerId))
      }
    })

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${receiptNo}.pdf"`,
      },
    })
  })
  .get('/receipts/:id/pdf', async ({ params, set }) => {
    const txId = parseInt(params.id, 10)
    if (isNaN(txId)) {
      set.status = 400
      return { error: 'Invalid transaction ID' }
    }

    const [file] = await db
      .select()
      .from(receiptFiles)
      .where(eq(receiptFiles.transactionId, txId))
      .limit(1)

    if (!file) {
      set.status = 404
      return { error: 'Receipt file not found' }
    }

    const [tx] = await db
      .select({ receiptNo: transactions.receiptNo })
      .from(transactions)
      .where(eq(transactions.id, txId))
      .limit(1)

    return new Response(file.pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${tx?.receiptNo || txId}.pdf"`,
      },
    })
  })
