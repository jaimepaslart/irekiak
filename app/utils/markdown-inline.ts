function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Escapes HTML then turns `**xxx**` into `<strong>xxx</strong>`. Designed
 * for the announcement editor and any other admin-authored short text that
 * needs light emphasis without a full markdown pipeline. Escape runs first
 * so user input can never inject raw HTML.
 */
export function renderInlineBold(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
