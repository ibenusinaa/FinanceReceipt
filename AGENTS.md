# AGENTS.md — Finance Receipt

### Tech Stack
- **Runtime:** Bun (TypeScript)
- **Framework:** Elysia v1.4.x
- **Database:** MySQL via Drizzle ORM v0.45.x
- **Auth:** Lucia v3 (session cookies + DrizzleMySQLAdapter)
- **Frontend:** Server-rendered HTML templates + HTMX v2 + Tailwind CDN
- **PDF:** PDFKit · **Excel:** xlsx

### Quick Start
```bash
bun install
bun run db:push          # create/update tables
bun run seed              # seed test user + 12 clients
bun run dev               # localhost:3000 with --watch auto-reload
```

### Scripts
| Script | What |
|---|---|
| `dev` | Start with `--watch` auto-reload |
| `start` | Production (migrate + run, no watch) |
| `db:push` | Push schema to MySQL |
| `db:generate` | Generate migration SQL |
| `db:migrate` | Run pending migrations |
| `seed` | Seed test user + 12 sample clients |

### src/ Map
```
src/
├── index.ts              # Elysia entrypoint, auth + route wiring
├── seed.ts               # DB seeder
├── db/
│   ├── schema.ts         # Drizzle table definitions
│   ├── index.ts          # MySQL2 connection + Drizzle instance
│   └── migrations/
├── lib/
│   ├── auth.ts           # login() — verify credentials + create session
│   └── lucia.ts          # Lucia instance + adapter config
├── middleware/
│   └── auth.ts           # Global derive: reads cookie, validates session
├── routes/
│   ├── auth.ts           # GET/POST /auth/login, POST /auth/logout
│   ├── transactions.ts   # Batch list + detail list
│   ├── upload.ts         # Excel upload → parse → preview → save
│   ├── mapping.ts        # Client search + batch assignment
│   └── receipt.ts        # Receipt generation + PDF download
├── services/
│   ├── excel.ts, mapping.ts, receipt.ts, pdf.ts
└── views/
    ├── layout.ts         # Base HTML shell (nav, logout, Tailwind + HTMX CDN)
    ├── login.ts          # Standalone login page (inline CSS, NO Tailwind CDN)
    ├── header-list.ts    # Batch list page (filters, table, pagination)
    ├── detail-list.ts    # Detail page + client picker dropdown JS
    └── components/
        └── modal.ts      # Reusable modal + upload preview
```

### Conventions
- **Views as functions** — every file in `src/views/` exports a function returning an HTML string
- **Auth guard** — `middleware/auth.ts` runs globally; protected routes use `.guard({ beforeHandle })` that redirects null users to `/auth/login`
- **Custom colors** — a `primary` palette (teal) and `emerald` are defined in `tailwind.config` inside `layout.ts`. Use `primary-{100,400,500,600,700,800}`, not Tailwind's default blue/green
- **Login page** — uses **inline CSS only**, no Tailwind. If restyling the login form, edit the `<style>` block — do NOT add CDN back

### Gotchas
- **Windows zombie Bun** — Ctrl+C may leave port 3000 occupied. Kill with `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`
- **Tailwind config order** — the `tailwind.config = {...}` `<script>` must appear **before** the CDN `<script>` tag in `layout.ts`, or custom colors silently fail
- **No build step** — Bun runs `.ts` directly, no bundler/transpiler needed

### Typecheck
```bash
bun run tsc --noEmit
```
