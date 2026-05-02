import { Elysia } from 'elysia'
import { db } from '../db/index'
import { transactionHeaders, transactions, clients } from '../db/schema'
import { desc, and, gte, lte, eq, sql, asc } from 'drizzle-orm'
import { layout } from '../views/layout'
import { headerListPage, renderTableBody } from '../views/header-list'
import { detailListPage, detailTableContainer } from '../views/detail-list'

type Bank = 'BCA' | 'MUFG' | 'HSBC'
type HeaderStatus = 'Draft' | 'Receipt Generated'

const PAGE_SIZE = 25

export const transactionRoutes = new Elysia()
  .get('/', async ({ query, request, set }) => {
    const bankRaw = query.bank
    const statusRaw = query.status
    const bank: Bank | undefined = bankRaw && ['BCA', 'MUFG', 'HSBC'].includes(bankRaw) ? bankRaw as Bank : undefined
    const status: HeaderStatus | undefined = statusRaw && ['Draft', 'Receipt Generated'].includes(statusRaw) ? statusRaw as HeaderStatus : undefined
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined

    const conditions = []
    if (bank) conditions.push(eq(transactionHeaders.bank, bank))
    if (status) conditions.push(eq(transactionHeaders.status, status))
    if (dateFrom) conditions.push(gte(transactionHeaders.uploadDate, dateFrom))
    if (dateTo) conditions.push(lte(transactionHeaders.uploadDate, dateTo))

    const headers = await db
      .select()
      .from(transactionHeaders)
      .where(and(...conditions))
      .orderBy(desc(transactionHeaders.uploadDate))

    const mapped = headers.map((h) => ({
      ...h,
      uploadDate: h.uploadDate.toISOString(),
    }))

    const isHtmx = request.headers.get('HX-Request') === 'true'

    if (isHtmx) {
      return renderTableBody(mapped)
    }

    const filters: Record<string, string> = {}
    if (bank) filters.bank = bank
    if (status) filters.status = status
    if (query.dateFrom) filters.dateFrom = query.dateFrom
    if (query.dateTo) filters.dateTo = query.dateTo

    return layout(headerListPage(mapped, filters))
  })
  .get('/transactions/:headerId', async ({ params, query, request }) => {
    const headerId = parseInt(params.headerId, 10)
    if (isNaN(headerId)) return 'Invalid header ID'

    const [header] = await db
      .select()
      .from(transactionHeaders)
      .where(eq(transactionHeaders.id, headerId))
      .limit(1)

    if (!header) return 'Header not found'

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.headerId, headerId))

    const total = countResult?.count ?? 0
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const page = Math.max(1, Math.min(parseInt(query.page || '1', 10) || 1, totalPages || 1))
    const offset = (page - 1) * PAGE_SIZE

    const rows = await db
      .select({
        id: transactions.id,
        clientId: transactions.clientId,
        transactionNo: transactions.transactionNo,
        transactionDate: transactions.transactionDate,
        senderAccountNo: transactions.senderAccountNo,
        senderName: transactions.senderName,
        amount: transactions.amount,
        clientName: clients.clientName,
        receiptNo: transactions.receiptNo,
        status: transactions.status,
      })
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .where(eq(transactions.headerId, headerId))
      .orderBy(asc(transactions.id))
      .limit(PAGE_SIZE)
      .offset(offset)

    const isHtmx = request.headers.get('HX-Request') === 'true'
    const mappedRows = rows.map((r) => ({
      ...r,
      transactionDate: r.transactionDate instanceof Date
        ? r.transactionDate.toISOString().slice(0, 10)
        : String(r.transactionDate),
      amount: String(r.amount),
    }))

    if (isHtmx) {
      return detailTableContainer(mappedRows, { page, totalPages, total }, headerId)
    }

    return layout(detailListPage(
      { ...header, uploadDate: header.uploadDate.toISOString() },
      mappedRows,
      { page, totalPages, total },
    ))
  })
