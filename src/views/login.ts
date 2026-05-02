export function loginPage(error?: string) {
  const errorHtml = error
    ? `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">${error}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — Finance Receipt</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
    <h1 class="text-2xl font-bold text-center mb-6">Finance Receipt</h1>
    ${errorHtml}
    <form method="POST" action="/auth/login">
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="username">Username</label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
               type="text" name="username" id="username" required autofocus>
      </div>
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
               type="password" name="password" id="password" required>
      </div>
      <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
              type="submit">Sign In</button>
    </form>
  </div>
</body>
</html>`
}
