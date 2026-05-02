import { mysqlTable, mysqlEnum, varchar, int, decimal, date, datetime, uniqueIndex, customType } from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'

const longblob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() { return 'longblob' },
})

export const users = mysqlTable('users', {
  id: varchar('id', { length: 21 }).primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
})

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 21 }).notNull().references(() => users.id),
  expiresAt: datetime('expires_at').notNull(),
})

export const clients = mysqlTable('clients', {
  id: int('id').primaryKey().autoincrement(),
  clientCode: varchar('client_code', { length: 50 }).notNull().unique(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  bankAccountNo: varchar('bank_account_no', { length: 50 }).notNull().unique(),
  bankName: varchar('bank_name', { length: 50 }).notNull(),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
})

export const transactionHeaders = mysqlTable('transaction_headers', {
  id: int('id').primaryKey().autoincrement(),
  bank: mysqlEnum('bank', ['BCA', 'MUFG', 'HSBC']).notNull(),
  uploadDate: datetime('upload_date').notNull(),
  totalTransactions: int('total_transactions').notNull().default(0),
  mappedCount: int('mapped_count').notNull().default(0),
  unmappedCount: int('unmapped_count').notNull().default(0),
  status: mysqlEnum('status', ['Draft', 'Receipt Generated']).notNull().default('Draft'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
})

export const transactions = mysqlTable('transactions', {
  id: int('id').primaryKey().autoincrement(),
  headerId: int('header_id').notNull().references(() => transactionHeaders.id),
  transactionNo: varchar('transaction_no', { length: 100 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  senderAccountNo: varchar('sender_account_no', { length: 50 }).notNull(),
  senderName: varchar('sender_name', { length: 255 }).notNull(),
  clientId: int('client_id').references(() => clients.id),
  receiptNo: varchar('receipt_no', { length: 50 }).unique(),
  status: mysqlEnum('status', ['Unmapped', 'Mapped', 'Receipt Generated']).notNull().default('Unmapped'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
})

export const receiptSequences = mysqlTable('receipt_sequences', {
  id: int('id').primaryKey().autoincrement(),
  bank: mysqlEnum('bank', ['BCA', 'MUFG', 'HSBC']).notNull(),
  date: date('date').notNull(),
  currentSequence: int('current_sequence').notNull().default(0),
}, (table) => ({
  bankDateUnique: uniqueIndex('bank_date_unique').on(table.bank, table.date),
}))

export const receiptFiles = mysqlTable('receipt_files', {
  id: int('id').primaryKey().autoincrement(),
  transactionId: int('transaction_id').notNull().unique().references(() => transactions.id),
  pdfBlob: longblob('pdf_blob').notNull(),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const transactionHeadersRelations = relations(transactionHeaders, ({ many }) => ({
  transactions: many(transactions),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  header: one(transactionHeaders, { fields: [transactions.headerId], references: [transactionHeaders.id] }),
  client: one(clients, { fields: [transactions.clientId], references: [clients.id] }),
  receiptFile: one(receiptFiles, { fields: [transactions.id], references: [receiptFiles.transactionId] }),
}))
