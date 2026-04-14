// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { withSlotLock } from './booking-lock'

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('withSlotLock', () => {
  it('runs sequential calls for the same slot in order', async () => {
    const slotId = 'slot-seq'
    const calls: string[] = []

    await withSlotLock(slotId, async () => {
      calls.push('a-start')
      await Promise.resolve()
      calls.push('a-end')
    })

    await withSlotLock(slotId, async () => {
      calls.push('b-start')
      await Promise.resolve()
      calls.push('b-end')
    })

    expect(calls).toEqual(['a-start', 'a-end', 'b-start', 'b-end'])
  })

  it('serializes concurrent calls for the same slot', async () => {
    const slotId = 'slot-concurrent'
    const order: string[] = []
    const first = deferred()
    const second = deferred()

    const p1 = withSlotLock(slotId, async () => {
      order.push('1-start')
      await first.promise
      order.push('1-end')
    })

    const p2 = withSlotLock(slotId, async () => {
      order.push('2-start')
      await second.promise
      order.push('2-end')
    })

    // Yield to the microtask queue so lock acquisition callbacks fire.
    await Promise.resolve()
    await Promise.resolve()

    // Only the first task may have started; the second is blocked.
    expect(order).toEqual(['1-start'])

    first.resolve()
    await p1
    // Flush microtasks so task 2 can acquire the lock and record its start.
    await Promise.resolve()
    await Promise.resolve()
    expect(order).toEqual(['1-start', '1-end', '2-start'])

    second.resolve()
    await p2
    expect(order).toEqual(['1-start', '1-end', '2-start', '2-end'])
  })

  it('runs different slots in parallel', async () => {
    const order: string[] = []
    const gateA = deferred()
    const gateB = deferred()

    const pA = withSlotLock('slot-A', async () => {
      order.push('A-start')
      await gateA.promise
      order.push('A-end')
    })

    const pB = withSlotLock('slot-B', async () => {
      order.push('B-start')
      await gateB.promise
      order.push('B-end')
    })

    await Promise.resolve()
    await Promise.resolve()

    // Both started despite no gate being resolved yet.
    expect(order).toContain('A-start')
    expect(order).toContain('B-start')

    gateB.resolve()
    await pB
    gateA.resolve()
    await pA

    expect(order.filter(x => x.startsWith('A'))).toEqual(['A-start', 'A-end'])
    expect(order.filter(x => x.startsWith('B'))).toEqual(['B-start', 'B-end'])
  })

  it('releases the lock when the callback throws', async () => {
    const slotId = 'slot-error'

    await expect(
      withSlotLock(slotId, async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    // Next call must proceed without being blocked by the error.
    let ran = false
    await withSlotLock(slotId, async () => {
      ran = true
    })
    expect(ran).toBe(true)
  })
})
