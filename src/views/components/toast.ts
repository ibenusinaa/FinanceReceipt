export function toast(message: string, type: 'success' | 'error' | 'info' = 'info'): string {
  const colors: Record<string, string> = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-primary-500',
  }
  return `
<div class="${colors[type]} text-white px-4 py-3 rounded shadow-lg mb-2 text-sm flex items-center justify-between toast-item" style="animation: slideIn 0.3s ease-out">
  <span>${message}</span>
  <button onclick="this.parentElement.remove()" class="ml-3 text-white/80 hover:text-white font-bold leading-none text-base">&times;</button>
</div>`
}
