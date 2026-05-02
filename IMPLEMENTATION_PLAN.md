# Finance Receipt — Implementation Plan

## Overview

Internal Finance team tool to upload bank transactions via Excel, auto-map them to clients, and generate downloadable PDF receipts. Server-rendered HTML with HTMX for interactivity.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Backend Framework | ElysiaJS |
| ORM | Drizzle ORM |
| Database | MySQL |
| Frontend | HTMX + Alpine.js (server-rendered HTML) |
| Auth | Lucia Auth |
| PDF Generation | pdfkit |
| Excel Parsing | xlsx (SheetJS) |

---

## Database Schema (Drizzle)

### `users` (Lucia)
- `id` — varchar(21), primary key
- `username` — varchar(255), unique, not null

### `sessions` (Lucia)
- `id` — varchar(255), primary key
- `userId` — varchar(21), foreign key → `users.id`
- `expiresAt` — datetime, not null

### `clients` (mock, read-only)
- `id` — int, auto increment, primary key
- `clientCode` — varchar(50), unique, not null
- `clientName` — varchar(255), not null
- `bankAccountNo` — varchar(50), unique, not null
- `bankName` — varchar(50), not null
- `createdAt` — datetime, default now
- `updatedAt` — datetime, default now, on update now

### `transaction_headers` (batch)
- `id` — int, auto increment, primary key
- `bank` — enum('BCA', 'MUFG', 'HSBC'), not null
- `uploadDate` — datetime, not null
- `totalTransactions` — int, not null, default 0
- `mappedCount` — int, not null, default 0
- `unmappedCount` — int, not null, default 0
- `status` — enum('Draft', 'Receipt Generated'), not null, default 'Draft'
- `createdAt` — datetime, default now
- `updatedAt` — datetime, default now, on update now

### `transactions` (detail rows)
- `id` — int, auto increment, primary key
- `headerId` — int, foreign key → `transaction_headers.id`, not null
- `transactionNo` — varchar(100), not null
- `transactionDate` — date, not null
- `amount` — decimal(15,2), not null
- `senderAccountNo` — varchar(50), not null
- `senderName` — varchar(255), not null
- `clientId` — int, nullable, foreign key → `clients.id`
- `receiptNo` — varchar(50), nullable, unique
- `status` — enum('Unmapped', 'Mapped', 'Receipt Generated'), not null, default 'Unmapped'
- `createdAt` — datetime, default now
- `updatedAt` — datetime, default now, on update now

### `receipt_sequences` (daily per-bank counter)
- `id` — int, auto increment, primary key
- `bank` — enum('BCA', 'MUFG', 'HSBC'), not null
- `date` — date, not null
- `currentSequence` — int, not null, default 0
- Unique constraint: `(bank, date)`

---

## Project Structure

```
src/
├── index.ts                  # Elysia app entrypoint
├── db/
│   ├── schema.ts             # All Drizzle table definitions
│   ├── index.ts              # DB connection (drizzle + mysql2)
│   └── migrations/           # Generated migrations
├── routes/
│   ├── auth.ts               # Login/logout routes
│   ├── upload.ts             # Excel upload + preview + save
│   ├── transactions.ts       # Header list + detail list pages
│   ├── mapping.ts            # Manual client assignment
│   └── receipt.ts            # Receipt generation + PDF download
├── services/
│   ├── excel.ts              # Excel parsing & validation
│   ├── mapping.ts            # Client auto-mapping logic
│   ├── receipt.ts            # Receipt number generation
│   └── pdf.ts                # PDF generation with pdfkit
├── views/
│   ├── layout.ts             # Base HTML template (doctype, head, nav)
│   ├── login.ts              # Login page HTML
│   ├── header-list.ts        # Transaction Header List page
│   ├── detail-list.ts        # Transaction Detail List page
│   └── components/
│       ├── table.ts          # Reusable table component
│       ├── modal.ts          # Alpine.js modal component
│       └── toast.ts          # Notification component
├── middleware/
│   └── auth.ts               # Lucia session validation middleware
├── lib/
│   ├── lucia.ts              # Lucia auth instance config
│   └── utils.ts              # Helper functions (format currency, dates, etc.)
├── types/
│   └── index.ts              # Shared TypeScript types
└── seed.ts                   # Seed script for mock clients + test user
```

---

## Environment Variables

Create `.env` (do not commit):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=finance_receipt
```

---

## Implementation Steps

### Step 1: Project Setup & Database Foundation

**Goal:** Initialize Bun project, install dependencies, define all Drizzle schemas, configure migrations.

**Commands:**
```bash
bun init
bun add elysia @elysiajs/html @elysiajs/static drizzle-orm mysql2 lucia xlsx pdfkit
bun add -d drizzle-kit typescript @types/bun
```

**Tasks:**
1. Create `tsconfig.json` with Bun-friendly settings (target esnext, module esnext, moduleResolution bundler, strict true)
2. Create `drizzle.config.ts` with MySQL connection from env vars
3. Create `src/db/schema.ts` with all 6 tables defined above
4. Create `src/db/index.ts` — MySQL connection pool + drizzle instance
5. Create `.env` with placeholder values
6. Run `bunx drizzle-kit generate` to generate migration SQL files
7. Create `src/seed.ts` — insert 10-15 mock clients and 1 test user
8. Add scripts to `package.json`: `dev`, `db:generate`, `db:migrate`, `db:push`, `seed`

**Expected outcome:** Project compiles, Drizzle schema is defined, migrations are generated, seed script is ready.

---

### Step 2: Auth Layer (Lucia)

**Goal:** Set up Lucia session-based auth with login/logout flow and route protection middleware.

**Tasks:**
1. Create `src/lib/lucia.ts` — configure Lucia with MySQL adapter
2. Create `src/middleware/auth.ts` — reads session cookie, validates, attaches user or redirects to `/login`
3. Create `src/views/login.ts` — simple login page
4. Create `src/routes/auth.ts` — GET/POST `/login`, POST `/logout`
5. Wire auth middleware into all routes except `/login`
6. Update `src/seed.ts` to create test user (`testuser` / `password123`)

**Expected outcome:** Visiting `/` redirects to `/login`. Login grants access. Logout clears session.

---

### Step 3: Transaction Header List (Page 1)

**Goal:** Build the main landing page showing all uploaded batches with filtering.

**Tasks:**
1. Create `src/views/layout.ts` — base HTML with HTMX, Alpine.js, Tailwind CSS CDN, nav bar
2. Create `src/views/header-list.ts` — filter bar, upload button, data table, pagination
3. Create `src/routes/transactions.ts` — `GET /` with optional filters, HTMX partial swaps
4. Wire behind auth middleware

**Expected outcome:** Landing page with empty table. Filters work via HTMX. Upload button visible.

---

### Step 4: Excel Upload Flow

**Goal:** Upload Excel, parse & validate, preview in modal, save as Draft batch.

**Tasks:**
1. Create `src/services/excel.ts` — parse Excel, validate columns, skip invalid rows
2. Create `src/routes/upload.ts` — `POST /upload` (parse + preview), `POST /upload/save` (save batch)
3. Create Alpine.js upload modal — file picker, preview table, save button, HTMX refresh
4. Integrate `@elysiajs/html` multipart handling

**Expected outcome:** Upload → preview modal → save → batch saved as Draft → table refreshes.

---

### Step 5: Transaction Detail List (Page 2)

**Goal:** Click "View Detail" → see all transactions with row-level actions.

**Tasks:**
1. Create `src/views/detail-list.ts` — back button, batch summary, detail table, action buttons
2. Extend `src/routes/transactions.ts` — `GET /transactions/:headerId` with client join
3. HTMX back navigation

**Expected outcome:** Detail page with transactions. Action buttons appear based on row status.

---

### Step 6: Client Mapping

**Goal:** Auto-map on upload save, manual assign for unmapped rows.

**Tasks:**
1. Create `src/services/mapping.ts` — auto-map by `senderAccountNo` → `clients.bankAccountNo`
2. Integrate auto-mapping into `POST /upload/save`
3. Create `src/routes/mapping.ts` — search API + assign endpoint
4. Create Alpine.js client search modal — debounce search, select, confirm, HTMX row swap

**Expected outcome:** Auto-mapping on save. Manual assign via search modal. No full page reload.

---

### Step 7: Receipt Generation & PDF

**Goal:** Generate unique receipt numbers, create PDF, trigger download.

**Tasks:**
1. Create `src/services/receipt.ts` — generate `[BANK]-[YYYYMMDD]-[SEQ]` with upsert logic
2. Create `src/services/pdf.ts` — pdfkit receipt with all required fields
3. Create `src/routes/receipt.ts` — `POST /transactions/:transactionId/receipt`, enforce status workflow
4. Wire buttons in detail list

**Expected outcome:** Click "Generate Receipt" → number assigned → status updates → PDF downloads.

---

### Step 8: Polish & Edge Cases

**Goal:** Error handling, UX improvements, audit logging, edge case handling.

**Tasks:**
1. Global error handler, toast notifications, HTMX loading indicators
2. Audit logging: `assignedBy`, `assignedAt`, `generatedBy`, `generatedAt` columns
3. Duplicate transaction detection on upload
4. Batch inserts, indexed columns, pagination
5. Status workflow enforcement, receipt number immutability
6. UI polish: status badges, confirmation dialogs, empty states

**Expected outcome:** Production-ready application with proper error handling, audit trail, polished UX.

---

## Key Implementation Notes

### Status Workflow
- `Unmapped` → `Mapped` → `Receipt Generated` (linear, irreversible)
- Enforce in route handlers and application logic

### Receipt Number Format
- `[BANK_CODE]-[YYYYMMDD]-[SEQUENCE]`
- Sequence resets daily per bank, zero-padded 3 digits
- Timezone: WIB (UTC+7)

### Atomicity
- All DB writes use `db.transaction(async (tx) => { ... })`

### HTMX Patterns
- `hx-get`, `hx-post`, `hx-target`, `hx-swap="innerHTML"`, `hx-indicator`, `hx-confirm`

### Alpine.js Patterns
- `x-data`, `x-show`, `x-model`, `@click`, `x-init`

---

## Open Questions (from PRD)

1. Re-assign client allowed while Draft? → **Assume yes**
2. Duplicate Transaction No on re-upload? → **Assume flagged + skipped**
3. PDF layout/branding? → **Assume simple, clean, company name at top**
4. More banks beyond v1? → **Assume only BCA/MUFG/HSBC for now**
5. Approval workflow? → **Assume no for v1**
