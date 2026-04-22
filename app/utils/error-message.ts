interface ApiErrorShape {
  statusMessage?: string
  message?: string
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiErrorShape
  return e?.statusMessage ?? e?.message ?? fallback
}
