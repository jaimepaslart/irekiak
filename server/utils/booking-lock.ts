/**
 * In-memory mutex keyed by slot id.
 *
 * Serializes concurrent booking attempts for the same time slot within a single
 * Node process. Combined with a DB transaction this prevents overbooking in the
 * common case. For multi-instance deployments a distributed lock (Redis, etc.)
 * would be required on top of this.
 */
const locks = new Map<string, Promise<unknown>>()

export async function withSlotLock<T>(slotId: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(slotId) ?? Promise.resolve()
  let resolve!: () => void
  const current = new Promise<void>((r) => {
    resolve = r
  })
  locks.set(slotId, previous.then(() => current))
  try {
    await previous
    return await fn()
  }
  finally {
    resolve()
    if (locks.get(slotId) === current) locks.delete(slotId)
  }
}
