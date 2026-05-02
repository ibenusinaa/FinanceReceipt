export function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finance Receipt</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <style>
    @keyframes spin { to { transform: rotate(360deg) } }
    .spinner { display: inline-block; width: 0.75rem; height: 0.75rem; border: 2px solid currentColor; border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; }
  </style>
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
