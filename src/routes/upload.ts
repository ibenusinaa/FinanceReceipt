import { Elysia, t } from 'elysia'
import { db } from '../db/index'
import { transactionHeaders, transactions } from '../db/schema'
import { parseExcel } from '../services/excel'
import { modal, previewContent } from '../views/components/modal'

const previewStore = new Map<string, { rows: Record<string, string | number>[] }>()

export const uploadRoutes = new Elysia()
  .post('/upload', async ({ body }) => {
    const buffer = await body.file.arrayBuffer()
    const result = parseExcel(buffer)

    if (result.errors.length > 0 && result.totalValid === 0) {
      const errorModal = modal('upload-error', 'Upload Failed',
        `<p class="text-red-600">${result.errors.join('<br>')}</p>`)
      return errorModal
    }

    const saveId = crypto.randomUUID()
    previewStore.set(saveId, { rows: result.rows })

    const content = previewContent(
      result.rows, result.banks, result.totalValid, result.totalInvalid, result.errors, saveId
    )

    const previewModal = `
${modal('upload-preview', 'Preview Upload', content, true)}
<script>
  document.getElementById('upload-preview-save-btn').addEventListener('click', () => {
    const id = document.getElementById('save-id')!.value
    fetch('/upload/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveId: id }),
    }).then(() => {
      window.location.href = '/'
    })
  })
</script>`

    return previewModal
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })
  .post('/upload/save', async ({ body, set }) => {
    const data = previewStore.get(body.saveId)
    if (!data) {
      set.status = 400
      return { error: 'Preview expired, please upload again' }
    }

    try {
      await db.transaction(async (tx) => {
        const byBank: Record<string, typeof data.rows> = {}
        for (const row of data.rows) {
          const bank = String(row.bank)
          if (!byBank[bank]) byBank[bank] = []
          byBank[bank]!.push(row)
        }

        for (const [bank, bankRows] of Object.entries(byBank)) {
          const [header] = await tx.insert(transactionHeaders).values({
            bank: bank as 'BCA' | 'MUFG' | 'HSBC',
            uploadDate: new Date(),
            totalTransactions: bankRows.length,
            unmappedCount: bankRows.length,
            mappedCount: 0,
            status: 'Draft',
          }).$returningId()

          if (!header) throw new Error('Failed to create header')

          const txRows = bankRows.map((r) => {
            const dateStr = String(r.transactionDate).replace(/[^0-9\-]/g, '')
            return {
              headerId: header.id,
              transactionNo: String(r.transactionNo),
              transactionDate: dateStr,
              amount: String(r.amount),
              senderAccountNo: String(r.senderAccountNo),
              senderName: String(r.senderName),
              status: 'Unmapped' as const,
            }
          })
          await tx.insert(transactions).values(txRows as any)
        }
      })

      previewStore.delete(body.saveId)

      set.status = 200
      return { success: true }
    } catch (e) {
      console.error('Save failed:', e)
      set.status = 500
      return { error: 'Failed to save batch' }
    }
  }, {
    body: t.Object({
      saveId: t.String(),
    }),
  })
