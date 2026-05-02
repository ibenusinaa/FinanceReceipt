import { Elysia } from 'elysia'
import { db } from '../db/index'
import { transactionHeaders } from '../db/schema'
import { desc, and, gte, lte, eq, sql } from 'drizzle-orm'
import { layout } from '../views/layout'
import { headerListPage, renderTableBody } from '../views/header-list'

type Bank = 'BCA' | 'MUFG' | 'HSBC'
type HeaderStatus = 'Draft' | 'Receipt Generated'

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
