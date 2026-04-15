import { logAudit } from './audit'

const DELAYS_MS = [1000, 5000, 15000] // exponential-ish: 1s, 5s, 15s

export interface RetryContext {
  channel: string
  targetType?: string
  targetId?: string
  recipient?: string
}

/**
 * Wraps an async function (typically resend.emails.send) with 3-attempt retry
 * + exponential backoff. Non-blocking in the sense that caller expects the fn
 * to throw on error — we catch, sleep, retry. If all 3 attempts fail we log
 * an audit entry and throw the final error.
 */
export async function withEmailRetry<T>(
  fn: () => Promise<T>,
  ctx: RetryContext,
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < DELAYS_MS.length; attempt++) {
    try {
      const result = await fn()
      if (attempt > 0) {
        void logAudit({
          actor: 'system',
          action: 'email.retry.success',
          targetType: ctx.targetType ?? 'email',
          targetId: ctx.targetId,
          metadata: { channel: ctx.channel, attempt, recipient: ctx.recipient },
        })
      }
      return result
    }
    catch (err) {
      lastErr = err
      const next = DELAYS_MS[attempt + 1]
      console.warn(`[email-retry] ${ctx.channel} attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err)
      void logAudit({
        actor: 'system',
        action: 'email.retry.attempt',
        targetType: ctx.targetType ?? 'email',
        targetId: ctx.targetId,
        metadata: { channel: ctx.channel, attempt: attempt + 1, recipient: ctx.recipient, error: err instanceof Error ? err.message : String(err) },
      })
      if (next === undefined) break
      await new Promise(r => setTimeout(r, DELAYS_MS[attempt]))
    }
  }
  void logAudit({
    actor: 'system',
    action: 'email.failed',
    targetType: ctx.targetType ?? 'email',
    targetId: ctx.targetId,
    metadata: { channel: ctx.channel, recipient: ctx.recipient, error: lastErr instanceof Error ? lastErr.message : String(lastErr) },
  })
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}
