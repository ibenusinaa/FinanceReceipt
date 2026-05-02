export function modal(id: string, title: string, body: string, showSave: boolean = false): string {
  return `
<div x-data="{ open: true }" x-show="open" x-cloak
     class="fixed inset-0 z-50 flex items-center justify-center"
     @keydown.escape.window="open = false; $el.remove()">
  <div class="fixed inset-0 bg-black/50" @click="open = false; $el.remove()"></div>
  <div class="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col z-10">
    <div class="flex items-center justify-between px-6 py-4 border-b">
      <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
      <button @click="open = false; $el.parentElement.parentElement.remove()"
              class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
    </div>
    <div class="px-6 py-4 overflow-auto flex-1">
      ${body}
    </div>
    ${showSave ? `
    <div class="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
      <button @click="open = false; $el.parentElement.parentElement.remove()"
              class="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded">Cancel</button>
      <button id="${id}-save-btn"
              class="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded">Save Batch</button>
    </div>` : ''}
  </div>
</div>`
}

export function previewContent(rows: Record<string, string | number>[], banks: Record<string, number>, totalValid: number, totalInvalid: number, errors: string[], saveId: string): string {
  const rowLimit = 10
  const displayRows = rows.slice(0, rowLimit)

  const bankList = Object.entries(banks)
    .map(([name, count]) => `${name} (${count})`)
    .join(', ')

  const rowsHtml = displayRows.map((r, i) => `
    <tr class="border-b text-sm ${i % 2 === 0 ? 'bg-gray-50' : ''}">
      <td class="px-3 py-2">${i + 1}</td>
      <td class="px-3 py-2">${r.transactionNo}</td>
      <td class="px-3 py-2">${r.transactionDate}</td>
      <td class="px-3 py-2">${r.bank}</td>
      <td class="px-3 py-2">${r.senderName}</td>
      <td class="px-3 py-2 text-right">${Number(r.amount).toLocaleString('id-ID')}</td>
    </tr>`
  ).join('')

  const errorList = errors.length > 0
    ? `<details class="mt-3"><summary class="text-sm text-red-600 cursor-pointer">Show ${errors.length} skipped rows</summary><ul class="text-xs text-red-500 mt-1 ml-4 list-disc">${errors.map((e) => `<li>${e}</li>`).join('')}</ul></details>`
    : ''

  const moreRows = rows.length > rowLimit ? `<p class="text-xs text-gray-400 mt-2">Showing first ${rowLimit} of ${rows.length} rows</p>` : ''

  return `
<div class="text-sm mb-4">
  <p class="mb-1"><span class="text-green-600 font-medium">${totalValid} rows imported</span>${totalInvalid > 0 ? ` · <span class="text-red-600 font-medium">${totalInvalid} rows skipped</span>` : ''}</p>
  <p class="text-gray-500">Banks: ${bankList || 'none'}</p>
</div>
<div class="overflow-x-auto">
  <table class="w-full">
    <thead>
      <tr class="bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        <th class="px-3 py-2">#</th>
        <th class="px-3 py-2">Transaction No</th>
        <th class="px-3 py-2">Date</th>
        <th class="px-3 py-2">Bank</th>
        <th class="px-3 py-2">Sender</th>
        <th class="px-3 py-2 text-right">Amount (IDR)</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</div>
${moreRows}
${errorList}
<input type="hidden" id="save-id" value="${saveId}">
`
}
