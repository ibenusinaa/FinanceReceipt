export function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finance Receipt</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen">
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
</body>
</html>`
}
