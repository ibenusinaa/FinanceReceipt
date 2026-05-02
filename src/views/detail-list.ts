interface DetailRow {
  id: number
  transactionNo: string
  transactionDate: string
  senderAccountNo: string
  senderName: string
  amount: string
  clientName: string | null
  receiptNo: string | null
  status: string
}

interface DetailHeader {
  id: number
  bank: string
  uploadDate: string
  totalTransactions: number
  mappedCount: number
  unmappedCount: number
  status: string
}

interface Pagination {
  page: number
  totalPages: number
  total: number
}

function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatShortDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatAmount(amount: string): string {
  return Number(amount).toLocaleString('id-ID')
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    Unmapped: 'bg-yellow-100 text-yellow-800',
    Mapped: 'bg-blue-100 text-blue-800',
    'Receipt Generated': 'bg-green-100 text-green-800',
  }
  return `<span class="px-2 py-1 text-xs font-medium rounded ${colors[status] || 'bg-gray-100'}">${status}</span>`
}

function actionButton(row: DetailRow): string {
  if (row.status === 'Unmapped') {
    return `<button disabled class="px-3 py-1 text-xs bg-gray-200 text-gray-400 rounded cursor-not-allowed">Assign Client</button>`
  }
  if (row.status === 'Mapped') {
    return `<button disabled class="px-3 py-1 text-xs bg-gray-200 text-gray-400 rounded cursor-not-allowed">Generate Receipt</button>`
  }
  return `<button disabled class="px-3 py-1 text-xs bg-gray-200 text-gray-400 rounded cursor-not-allowed">Download PDF</button>`
}

function paginationControls(pagination: Pagination, headerId: number): string {
  const prevDisabled = pagination.page <= 1
  const nextDisabled = pagination.page >= pagination.totalPages

  return `
<div class="flex items-center justify-between px-4 py-2 bg-white border-t">
  <button ${prevDisabled ? 'disabled' : ''}
    hx-get="/transactions/${headerId}?page=${pagination.page - 1}"
    hx-target="#detail-table-container" hx-swap="innerHTML"
    class="px-3 py-1 text-sm border rounded ${prevDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-700'}">Previous</button>
  <span class="text-sm text-gray-500">Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} rows)</span>
  <button ${nextDisabled ? 'disabled' : ''}
    hx-get="/transactions/${headerId}?page=${pagination.page + 1}"
    hx-target="#detail-table-container" hx-swap="innerHTML"
    class="px-3 py-1 text-sm border rounded ${nextDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-700'}">Next</button>
</div>`
}

export function detailTableContainer(rows: DetailRow[], pagination: Pagination, headerId: number): string {
  if (rows.length === 0) {
    return `
<div id="detail-table-container">
  <div class="text-center py-16 text-gray-500">
    <p class="text-lg mb-2">No transactions found</p>
  </div>
</div>`
  }

  const rowHtml = rows.map((r, i) => `
    <tr class="border-b hover:bg-gray-50 text-sm">
      <td class="px-3 py-2 text-gray-500">${(pagination.page - 1) * 25 + i + 1}</td>
      <td class="px-3 py-2 font-mono text-xs">${r.transactionNo}</td>
      <td class="px-3 py-2">${formatShortDate(r.transactionDate)}</td>
      <td class="px-3 py-2 font-mono text-xs">${r.senderAccountNo}</td>
      <td class="px-3 py-2">${r.senderName}</td>
      <td class="px-3 py-2 text-right">${formatAmount(r.amount)}</td>
      <td class="px-3 py-2">${r.clientName || '<span class="text-gray-400">—</span>'}</td>
      <td class="px-3 py-2 font-mono text-xs">${r.receiptNo || '<span class="text-gray-400">—</span>'}</td>
      <td class="px-3 py-2">${statusBadge(r.status)}</td>
      <td class="px-3 py-2">${actionButton(r)}</td>
    </tr>`
  ).join('')

  return `
<div id="detail-table-container">
  <div class="max-h-[450px] overflow-y-auto border-b">
    <table class="w-full bg-white">
      <thead>
        <tr class="bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10">
          <th class="px-3 py-2 w-10">#</th>
          <th class="px-3 py-2">TX No</th>
          <th class="px-3 py-2">Date</th>
          <th class="px-3 py-2">Sender Account</th>
          <th class="px-3 py-2">Sender Name</th>
          <th class="px-3 py-2 text-right">Amount</th>
          <th class="px-3 py-2">Client</th>
          <th class="px-3 py-2">Receipt No</th>
          <th class="px-3 py-2">Status</th>
          <th class="px-3 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>${rowHtml}</tbody>
    </table>
  </div>
  ${paginationControls(pagination, headerId)}
</div>`
}

export function detailListPage(header: DetailHeader, rows: DetailRow[], pagination: Pagination): string {
  return `
<div class="mb-4">
  <a href="/" class="text-blue-600 hover:text-blue-800 text-sm">&larr; Back to Transaction List</a>
</div>

<div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-y-2 text-sm">
    <div><span class="text-gray-500">Bank:</span> <span class="font-medium">${header.bank}</span></div>
    <div><span class="text-gray-500">Upload:</span> <span class="font-medium">${formatDate(header.uploadDate)}</span></div>
    <div><span class="text-gray-500">Total:</span> <span class="font-medium">${header.totalTransactions}</span></div>
    <div>
      <span class="text-blue-600 font-medium">${header.mappedCount} Mapped</span>
      <span class="text-gray-400 mx-1">/</span>
      <span class="text-orange-600 font-medium">${header.unmappedCount} Unmapped</span>
    </div>
  </div>
  <div class="mt-2 pt-2 border-t text-sm">
    <span class="text-gray-500">Status:</span> ${statusBadge(header.status)}
  </div>
</div>

${detailTableContainer(rows, pagination, header.id)}`
}
