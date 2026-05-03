interface DetailRow {
  id: number
  transactionNo: string
  transactionDate: string
  senderAccountNo: string
  senderName: string
  amount: string
  clientId: number | null
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

function escAttr(val: string): string {
  return val.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatShortDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatAmount(amount: string): string {
  return Number(amount).toLocaleString('id-ID')
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    Unmapped: 'bg-yellow-100 text-yellow-800',
    Mapped: 'bg-primary-100 text-primary-800',
    'Receipt Generated': 'bg-emerald-100 text-emerald-800',
  }
  return `<span class="px-2 py-1 text-xs font-medium rounded ${colors[status] || 'bg-gray-100'}">${status}</span>`
}

function clientCell(r: DetailRow): string {
  if (r.status === 'Receipt Generated') {
    return r.clientName || '<span class="text-gray-400">—</span>'
  }
  const oname = escAttr(r.clientName || '')
  return `<div class="client-picker" data-tx="${r.id}" data-oid="${r.clientId ?? ''}" data-oname="${oname}"></div>`
}

function actionButton(r: DetailRow): string {
  if (r.status === 'Mapped') {
    return `<button onclick="generateReceipt(${r.id})" id="gen-receipt-${r.id}"
            class="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded">Generate Receipt</button>`
  }
  if (r.status === 'Receipt Generated') {
    return `<button onclick="downloadReceipt(${r.id})" id="dl-pdf-${r.id}"
            class="px-3 py-1 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded">Download PDF</button>`
  }
  return ''
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
      <td class="px-3 py-2">${clientCell(r)}</td>
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
  <div class="mt-2">
    <button id="save-btn" onclick="savePending()"
            class="w-full bg-gray-300 text-gray-700 font-medium py-2 rounded text-sm cursor-not-allowed" disabled>
      Save 0 Changes
    </button>
  </div>
</div>
<script>
(function() {
  if (!window.__pickerStore) {
    window.__pickerStore = { items: [] }
  }

  window.savePending = function() {
    if (window.__pickerStore.items.length === 0) return
    var btn = document.getElementById('save-btn')
    btn.disabled = true
    btn.className = 'w-full bg-emerald-600 text-white font-medium py-2 rounded text-sm opacity-70 cursor-wait'
    btn.innerHTML = '<span class="spinner mr-2 align-middle"></span>Saving...'

    const assignments = window.__pickerStore.items.map(function(i) { return { txId: i.txId, clientId: i.clientId } })
    fetch('/transactions/assign-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: assignments }),
    }).then(function() { window.location.reload() }).catch(function() {
      alert('Save failed')
      window.updateSaveButton()
    })
  }

  window.updateSaveButton = function() {
    var btn = document.getElementById('save-btn')
    if (!btn) return
    var count = window.__pickerStore.items.length
    btn.textContent = 'Save ' + count + ' Changes'
    if (count > 0) {
      btn.className = 'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded text-sm'
      btn.disabled = false
    } else {
      btn.className = 'w-full bg-gray-300 text-gray-700 font-medium py-2 rounded text-sm cursor-not-allowed'
      btn.disabled = true
    }
  }

  window.generateReceipt = function(txId) {
    var btn = document.getElementById('gen-receipt-' + txId)
    if (!btn) return
    btn.disabled = true
    btn.className = 'px-3 py-1 text-xs bg-emerald-400 text-white rounded cursor-wait'
    btn.innerHTML = '<span class="spinner mr-1 align-middle"></span>'

    fetch('/receipts/' + txId + '/generate', { method: 'POST' })
      .then(function(r) { if (!r.ok) throw new Error(); return r.blob() })
      .then(function(blob) {
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        window.location.reload()
      })
      .catch(function() {
        alert('Failed to generate receipt')
        if (btn) {
          btn.disabled = false
          btn.className = 'px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded'
          btn.textContent = 'Generate Receipt'
        }
      })
  }

  window.downloadReceipt = function(txId) {
    var btn = document.getElementById('dl-pdf-' + txId)
    if (!btn) return
    btn.disabled = true
    btn.className = 'px-3 py-1 text-xs bg-primary-400 text-white rounded cursor-wait'
    btn.innerHTML = '<span class="spinner mr-1 align-middle"></span>'

    fetch('/receipts/' + txId + '/pdf')
      .then(function(r) { if (!r.ok) throw new Error(); return r.blob() })
      .then(function(blob) {
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
      .catch(function() {
        alert('Failed to download PDF')
      })
      .finally(function() {
        if (btn) {
          btn.disabled = false
          btn.className = 'px-3 py-1 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded'
          btn.textContent = 'Download PDF'
        }
      })
  }

  var dropdown = document.getElementById('table-dropdown-portal')
  if (!dropdown) {
    dropdown = document.createElement('div')
    dropdown.id = 'table-dropdown-portal'
    dropdown.style.cssText = 'position:fixed;z-index:9999;display:none;background:white;border:1px solid #ddd;border-top:none;border-radius:0 0 4px 4px;box-shadow:0 4px 6px rgba(0,0,0,0.1);max-height:12rem;overflow-y:auto'
    document.body.appendChild(dropdown)
  }

  var activePicker = null
  var searchTimer = null

  function closeDropdown() {
    dropdown.style.display = 'none'
    dropdown.innerHTML = ''
    if (activePicker) activePicker.pickerOpen = false
    activePicker = null
  }

  document.addEventListener('mousedown', function(e) {
    if (activePicker) {
      var inside = activePicker.el.contains(e.target) || dropdown.contains(e.target)
      if (!inside) closeDropdown()
    }
  })

  window.addEventListener('scroll', function() { if (activePicker) closeDropdown() }, true)

  function showDropdown(picker) {
    if (picker.results.length === 0) { closeDropdown(); return }
    var rect = picker.inputEl.getBoundingClientRect()
    dropdown.style.top = rect.bottom + 'px'
    dropdown.style.left = rect.left + 'px'
    dropdown.style.width = rect.width + 'px'
    dropdown.innerHTML = picker.results.map(function(c) {
      return '<div class="pl-result px-2 py-1.5 hover:bg-primary-100 cursor-pointer text-xs border-b last:border-0" data-cid="' + c.id + '" data-cname="' + c.clientName.replace(/"/g, '&quot;') + '">' +
        '<span class="font-medium">' + c.clientCode + '</span>' +
        '<span class="text-gray-500 ml-1"> \u2014 ' + c.clientName + '</span></div>'
    }).join('')
    dropdown.querySelectorAll('.pl-result').forEach(function(el) {
      el.addEventListener('mousedown', function(e) {
        e.preventDefault()
        var cid = parseInt(this.dataset.cid)
        var cname = this.dataset.cname
        picker.select(cid, cname)
        closeDropdown()
      })
    })
    dropdown.style.display = 'block'
    picker.pickerOpen = true
    activePicker = picker
  }

  function initPicker(el) {
    var txId = parseInt(el.dataset.tx)
    var oid = el.dataset.oid ? parseInt(el.dataset.oid) : null
    var oname = el.dataset.oname || null
    var selId = oid
    var selName = oname
    var results = []
    var pickerOpen = false

    el.innerHTML = ''
    el.className = 'client-picker relative'

    var selDiv = document.createElement('span')
    selDiv.className = 'picker-selected flex items-center gap-1'
    selDiv.style.cssText = selId ? '' : 'display:none'

    var nameSpan = document.createElement('span')
    nameSpan.className = 'picker-name text-xs'
    nameSpan.textContent = selName || '\u2014'
    nameSpan.style.cursor = 'pointer'
    nameSpan.addEventListener('click', function() { showInput(picker) })

    var clearBtn = document.createElement('button')
    clearBtn.className = 'picker-clear text-red-400 hover:text-red-600 text-xs ml-1'
    clearBtn.textContent = '\u00d7'
    clearBtn.addEventListener('click', function(e) { e.stopPropagation(); clear(picker) })

    var unsaved = document.createElement('span')
    unsaved.className = 'picker-unsaved ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-100 text-orange-700'
    unsaved.textContent = 'Unsaved'
    unsaved.style.display = (selId !== oid) ? '' : 'none'

    selDiv.appendChild(nameSpan)
    selDiv.appendChild(clearBtn)
    selDiv.appendChild(unsaved)

    var inputEl = document.createElement('input')
    inputEl.type = 'text'
    inputEl.className = 'picker-input w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400'
    inputEl.placeholder = 'Search client...'
    inputEl.style.cssText = selId ? 'display:none' : ''

    inputEl.addEventListener('input', function() {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(function() { search(picker) }, 300)
    })
    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { closeDropdown() }
    })
    inputEl.addEventListener('focus', function() {
      if (inputEl.value.length >= 2) search(picker)
    })

    el.appendChild(selDiv)
    el.appendChild(inputEl)

    var picker = {
      el: el, txId: txId, oid: oid, oname: oname,
      selId: selId, selName: selName, results: results,
      inputEl: inputEl, selDiv: selDiv, nameSpan: nameSpan, unsavedEl: unsaved,
      pickerOpen: pickerOpen,
    }

    el.__picker = picker

    function showInput(p) {
      p.selDiv.style.display = 'none'
      p.inputEl.style.display = ''
      p.inputEl.focus()
    }

    function hideInput(p) {
      p.selDiv.style.display = ''
      p.inputEl.style.display = 'none'
    }

    async function search(p) {
      if (activePicker && activePicker !== p) closeDropdown()
      var q = p.inputEl.value
      if (q.length < 2) { p.results = []; closeDropdown(); return }
      try {
        var res = await fetch('/api/clients/search?q=' + encodeURIComponent(q))
        p.results = await res.json()
        showDropdown(p)
      } catch(e) {}
    }

    function clear(p) {
      p.selId = null
      p.selName = null
      showInput(p)
      p.inputEl.value = ''
      p.unsavedEl.style.display = 'none'
      window.__pickerStore.items = window.__pickerStore.items.filter(function(i) { return i.txId !== p.txId })
      window.updateSaveButton()
    }

    picker.select = function(id, name) {
      picker.selId = id
      picker.selName = name
      picker.nameSpan.textContent = name
      picker.unsavedEl.style.display = (id !== picker.oid) ? '' : 'none'
      hideInput(picker)
      picker.inputEl.value = ''
      window.__pickerStore.items = window.__pickerStore.items.filter(function(i) { return i.txId !== picker.txId })
      window.__pickerStore.items.push({ txId: picker.txId, clientId: id })
      window.updateSaveButton()
    }
  }

  document.querySelectorAll('.client-picker').forEach(function(el) {
    if (!el.__picker) {
      initPicker(el)
    }
  })
})()
</script>
<div id="table-dropdown-portal"></div>`
}

export function detailListPage(header: DetailHeader, rows: DetailRow[], pagination: Pagination): string {
  return `
<div class="mb-4">
  <a href="/" class="text-primary-500 hover:text-primary-800 text-sm">&larr; Back to Transaction List</a>
</div>

<div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-y-2 text-sm">
    <div><span class="text-gray-500">Bank:</span> <span class="font-medium">${header.bank}</span></div>
    <div><span class="text-gray-500">Upload:</span> <span class="font-medium">${formatDate(header.uploadDate)}</span></div>
    <div><span class="text-gray-500">Total:</span> <span class="font-medium">${header.totalTransactions}</span></div>
    <div>
      <span class="text-primary-500 font-medium">${header.mappedCount} Mapped</span>
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
