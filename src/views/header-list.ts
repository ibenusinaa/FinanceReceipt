interface HeaderRow {
  id: number
  bank: string
  uploadDate: string
  totalTransactions: number
  mappedCount: number
  unmappedCount: number
  status: string
}

function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    Draft: 'bg-yellow-100 text-yellow-800',
    'Receipt Generated': 'bg-green-100 text-green-800',
  }
  return `<span class="px-2 py-1 text-xs font-medium rounded ${colors[status] || 'bg-gray-100 text-gray-800'}">${status}</span>`
}

function renderTable(headers: HeaderRow[], hasRows: boolean): string {
  if (!hasRows) {
    return `
    <div class="text-center py-16 text-gray-500">
      <p class="text-lg mb-2">No transactions yet</p>
      <p class="text-sm">Upload an Excel file to get started.</p>
    </div>`
  }

  const rows = headers.map((h) => `
    <tr class="border-b hover:bg-gray-50">
      <td class="px-4 py-3 text-sm text-gray-600">${formatDate(h.uploadDate)}</td>
      <td class="px-4 py-3 text-sm font-medium">${h.bank}</td>
      <td class="px-4 py-3 text-sm text-center">${h.totalTransactions}</td>
      <td class="px-4 py-3 text-sm text-center text-blue-600">${h.mappedCount}</td>
      <td class="px-4 py-3 text-sm text-center text-orange-600">${h.unmappedCount}</td>
      <td class="px-4 py-3 text-sm">${statusBadge(h.status)}</td>
      <td class="px-4 py-3 text-sm">
        <a href="/transactions/${h.id}" class="text-blue-600 hover:text-blue-800">View Detail</a>
      </td>
    </tr>`
  ).join('')

  return `
  <div class="overflow-x-auto">
    <table class="w-full bg-white rounded-lg">
      <thead>
        <tr class="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <th class="px-4 py-3">Upload Date</th>
          <th class="px-4 py-3">Bank</th>
          <th class="px-4 py-3 text-center">Total</th>
          <th class="px-4 py-3 text-center">Mapped</th>
          <th class="px-4 py-3 text-center">Unmapped</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody id="table-body">
        ${rows}
      </tbody>
    </table>
  </div>`
}

export function headerListPage(headers: HeaderRow[], filters: Record<string, string> = {}): string {
  const bankSelected = (val: string) => filters.bank === val ? 'selected' : ''
  const statusSelected = (val: string) => filters.status === val ? 'selected' : ''

  return `
  <div id="modal-container"></div>

  <h2 class="text-xl font-semibold text-gray-800 mb-4">Transaction List</h2>

  <div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
    <div class="flex flex-wrap items-end gap-3">
      <div>
        <label class="block text-xs text-gray-500 mb-1">From</label>
        <input type="date" name="dateFrom" value="${filters.dateFrom || ''}"
               class="border rounded px-2 py-1.5 text-sm">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">To</label>
        <input type="date" name="dateTo" value="${filters.dateTo || ''}"
               class="border rounded px-2 py-1.5 text-sm">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Bank</label>
        <select name="bank" class="border rounded px-2 py-1.5 text-sm">
          <option value="">All</option>
          <option value="BCA" ${bankSelected('BCA')}>BCA</option>
          <option value="MUFG" ${bankSelected('MUFG')}>MUFG</option>
          <option value="HSBC" ${bankSelected('HSBC')}>HSBC</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Status</label>
        <select name="status" class="border rounded px-2 py-1.5 text-sm">
          <option value="">All</option>
          <option value="Draft" ${statusSelected('Draft')}>Draft</option>
          <option value="Receipt Generated" ${statusSelected('Receipt Generated')}>Receipt Generated</option>
        </select>
      </div>
      <button hx-get="/" hx-target="#table-container" hx-swap="innerHTML"
              hx-include="[name='dateFrom'],[name='dateTo'],[name='bank'],[name='status']"
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm">
        Apply
      </button>
      <button onclick="document.querySelector('[name=dateFrom]').value='';document.querySelector('[name=dateTo]').value='';document.querySelector('[name=bank]').value='';document.querySelector('[name=status]').value='';htmx.trigger('button[hx-get]', 'click')"
              class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded text-sm">
        Reset
      </button>
      <div class="ml-auto">
        <form hx-encoding="multipart/form-data" hx-post="/upload" hx-target="#modal-container" hx-swap="innerHTML"
              hx-trigger="change from:#file-input" class="inline">
          <input type="file" id="file-input" name="file" accept=".xlsx,.xls" class="hidden"
                 onchange="setTimeout(() => this.value = '', 300)">
        </form>
        <button onclick="document.getElementById('file-input').click()"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm">
          Upload Excel
        </button>
      </div>
    </div>
  </div>

  <div id="table-container">
    ${renderTable(headers, headers.length > 0)}
  </div>

  <div class="flex items-center justify-between mt-4 text-sm text-gray-500">
    <span>Page 1 of 1</span>
    <div class="flex gap-2">
      <button disabled class="px-3 py-1 border rounded bg-gray-100 text-gray-400 cursor-not-allowed">Previous</button>
      <button disabled class="px-3 py-1 border rounded bg-gray-100 text-gray-400 cursor-not-allowed">Next</button>
    </div>
  </div>`
}

export function renderTableBody(headers: HeaderRow[]): string {
  if (headers.length === 0) {
    return `<div class="text-center py-16 text-gray-500">
      <p class="text-lg mb-2">No transactions found</p>
      <p class="text-sm">Try adjusting your filters.</p>
    </div>`
  }

  const rows = headers.map((h) => `
    <tr class="border-b hover:bg-gray-50">
      <td class="px-4 py-3 text-sm text-gray-600">${formatDate(h.uploadDate)}</td>
      <td class="px-4 py-3 text-sm font-medium">${h.bank}</td>
      <td class="px-4 py-3 text-sm text-center">${h.totalTransactions}</td>
      <td class="px-4 py-3 text-sm text-center text-blue-600">${h.mappedCount}</td>
      <td class="px-4 py-3 text-sm text-center text-orange-600">${h.unmappedCount}</td>
      <td class="px-4 py-3 text-sm">${statusBadge(h.status)}</td>
      <td class="px-4 py-3 text-sm">
        <a href="/transactions/${h.id}" class="text-blue-600 hover:text-blue-800">View Detail</a>
      </td>
    </tr>`
  ).join('')

  return `
  <div class="overflow-x-auto">
    <table class="w-full bg-white rounded-lg">
      <thead>
        <tr class="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <th class="px-4 py-3">Upload Date</th>
          <th class="px-4 py-3">Bank</th>
          <th class="px-4 py-3 text-center">Total</th>
          <th class="px-4 py-3 text-center">Mapped</th>
          <th class="px-4 py-3 text-center">Unmapped</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody id="table-body">
        ${rows}
      </tbody>
    </table>
  </div>`
}
