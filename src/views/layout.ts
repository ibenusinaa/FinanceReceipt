export function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finance Receipt</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: {
              100: '#cceff4',
              400: '#2db6c9',
              500: '#0096a9',
              600: '#008090',
              700: '#006b78',
              800: '#005661',
            }
          }
        }
      }
    }
  </script>
  <style>
    @keyframes spin { to { transform: rotate(360deg) } }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
    @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
    .spinner { display: inline-block; width: 0.75rem; height: 0.75rem; border: 2px solid currentColor; border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; }
    .htmx-indicator { opacity: 0; transition: opacity 200ms ease-in; pointer-events: none; }
    .htmx-request .htmx-indicator { opacity: 1; }
    .htmx-request.htmx-indicator { opacity: 1; }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container" class="fixed top-4 right-4 z-[9999] flex flex-col items-end" style="max-width: 24rem"></div>
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <h1 class="text-lg font-semibold text-gray-800">Finance Receipt</h1>
      <form method="POST" action="/auth/logout">
        <button type="submit" class="text-sm text-gray-500 hover:text-red-600">Logout</button>
      </form>
    </div>
  </nav>
  <main class="max-w-7xl mx-auto px-4 py-6">
    ${content}
  </main>
  <script>
    (function() {
      var container = document.getElementById('toast-container')

      window.showToast = function(message, type) {
        type = type || 'info'
        var colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-primary-500' }
        var el = document.createElement('div')
        el.className = (colors[type] || colors.info) + ' text-white px-4 py-3 rounded shadow-lg mb-2 text-sm flex items-center justify-between'
        el.style.animation = 'slideIn 0.3s ease-out'
        el.innerHTML = '<span>' + message + '</span><button class="ml-3 text-white/80 hover:text-white font-bold leading-none text-base">&times;</button>'
        el.querySelector('button').addEventListener('click', function() { el.remove() })
        container.appendChild(el)
        setTimeout(function() {
          el.style.animation = 'fadeOut 0.3s ease-out'
          setTimeout(function() { if (el.parentNode) el.remove() }, 300)
        }, 4000)
      }

      document.body.addEventListener('htmx:afterSettle', function(evt) {
        if (!evt.detail || !evt.detail.xhr) return
        var trigger = evt.detail.xhr.getResponseHeader('HX-Trigger')
        if (!trigger) return
        try {
          var data = JSON.parse(trigger)
          if (data && data.showToast) {
            showToast(data.showToast.message || data.showToast, data.showToast.type || 'info')
          }
        } catch(e) {}
      })

      document.addEventListener('showToastEvent', function(evt) {
        showToast(evt.detail.message, evt.detail.type)
      })
    })()
  </script>
</body>
</html>`
}
