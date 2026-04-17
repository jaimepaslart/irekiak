export function splitParagraphs(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
}
