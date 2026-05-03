export function loginPage(error?: string) {
  const errorHtml = error
    ? `<div class="alert-error">${error}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — Finance Receipt</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      background: #f3f4f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 24rem;
    }
    .login-card h1 {
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      margin: 0 0 1.5rem;
    }
    .login-card label {
      display: block;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .login-card input {
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      -webkit-appearance: none;
      appearance: none;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      color: #374151;
      line-height: 1.25;
    }
    .login-card input:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.3);
      border-color: #3b82f6;
    }
    .form-group { margin-bottom: 1rem; }
    .form-group-last { margin-bottom: 1.5rem; }
    .btn-signin {
      background: #0096a9;
      color: white;
      font-weight: 700;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      width: 100%;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }
    .btn-signin:hover { background: #006b78; }
    .btn-signin:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.3);
    }
    .alert-error {
      background: #fde8e8;
      border: 1px solid #f8b4b4;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border-radius: 0.25rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <h1>Finance Receipt</h1>
    ${errorHtml}
    <form method="POST" action="/auth/login">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" name="username" id="username" required autofocus>
      </div>
      <div class="form-group-last">
        <label for="password">Password</label>
        <input type="password" name="password" id="password" required>
      </div>
      <button class="btn-signin" type="submit">Sign In</button>
    </form>
  </div>
</body>
</html>`
}
