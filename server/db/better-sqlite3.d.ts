/**
 * Minimal ambient declaration for better-sqlite3.
 *
 * The upstream package stopped bundling TypeScript types. Drizzle types the
 * drizzle() wrapper for us, so we only need enough surface here to satisfy
 * `new Database(...)`, `pragma(...)`, and `transaction(...)` used locally.
 */
declare module 'better-sqlite3' {
  namespace Database {
    interface Statement {
      run: (...params: unknown[]) => { changes: number, lastInsertRowid: number | bigint }
      get: (...params: unknown[]) => unknown
      all: (...params: unknown[]) => unknown[]
    }

    interface Transaction<T extends (...args: never[]) => unknown> {
      (...args: Parameters<T>): ReturnType<T>
      deferred: Transaction<T>
      immediate: Transaction<T>
      exclusive: Transaction<T>
    }

    interface Database {
      pragma: (pragma: string, options?: { simple?: boolean }) => unknown
      prepare: (source: string) => Statement
      exec: (source: string) => Database
      transaction: <T extends (...args: never[]) => unknown>(fn: T) => Transaction<T>
      close: () => void
      readonly open: boolean
      readonly name: string
    }
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Record<string, unknown>): Database.Database
    (filename: string, options?: Record<string, unknown>): Database.Database
  }

  const Database: DatabaseConstructor
  export = Database
}
