import { Elysia, t } from 'elysia'
import { db } from '../db/index'
import { transactionHeaders, transactions } from '../db/schema'
import { parseExcel } from '../services/excel'
import { autoMapTransactions } from '../services/mapping'
import { modal, previewContent } from '../views/components/modal'
import { inArray } from 'drizzle-orm'

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
    var btn = document.getElementById('upload-preview-save-btn')
    btn.disabled = true
    btn.innerHTML = '<span class="spinner mr-2 align-middle"></span>Saving...'
    btn.className = 'px-4 py-2 text-sm bg-primary-400 text-white rounded cursor-wait'

    const id = document.getElementById('save-id').value
    fetch('/upload/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveId: id }),
    }).then(r => r.json()).then(data => {
      window.showToast('Batch saved successfully', 'success')
      if (data.skipped > 0) {
        window.showToast(data.skipped + ' duplicate transaction(s) skipped', 'info')
      }
      setTimeout(function() { window.location.href = '/' }, 1200)
    }).catch(() => {
      alert('Save failed')
      btn.disabled = false
      btn.textContent = 'Save Batch'
      btn.className = 'px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded'
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
      let skippedTotal = 0

      await db.transaction(async (tx) => {
        const byBank: Record<string, typeof data.rows> = {}
        for (const row of data.rows) {
          const bank = String(row.bank)
          if (!byBank[bank]) byBank[bank] = []
          byBank[bank]!.push(row)
        }

        const allTxNos = data.rows.map((r) => String(r.transactionNo))
        const existing = await tx
          .select({ transactionNo: transactions.transactionNo })
          .from(transactions)
          .where(inArray(transactions.transactionNo, allTxNos))
        const existingSet = new Set(existing.map((e) => e.transactionNo))

        for (const [bank, bankRows] of Object.entries(byBank)) {
          const uniqueRows = bankRows.filter((r) => !existingSet.has(String(r.transactionNo)))
          const skipped = bankRows.length - uniqueRows.length
          skippedTotal += skipped

          if (uniqueRows.length === 0) continue

          const [header] = await tx.insert(transactionHeaders).values({
            bank: bank as 'BCA' | 'MUFG' | 'HSBC',
            uploadDate: new Date(),
            totalTransactions: uniqueRows.length,
            unmappedCount: uniqueRows.length,
            mappedCount: 0,
            status: 'Draft',
          }).$returningId()

          if (!header) throw new Error('Failed to create header')

          const txRows = uniqueRows.map((r) => ({
            headerId: header.id,
            transactionNo: String(r.transactionNo),
            transactionDate: String(r.transactionDate),
            amount: String(r.amount),
            senderAccountNo: String(r.senderAccountNo),
            senderName: String(r.senderName),
            status: 'Unmapped' as const,
          }))
          await tx.insert(transactions).values(txRows as any)
          await autoMapTransactions(tx as any, header.id)
        }
      })

      previewStore.delete(body.saveId)

      return { success: true, skipped: skippedTotal }
    } catch (e) {
      console.error('Save failed:', e)
      set.status = 500
      return { error: 'Failed to save batch: ' + (e as Error).message }
    }
  }, {
    body: t.Object({
      saveId: t.String(),
    }),
  })
