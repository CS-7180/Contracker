// TODO: Implement in M1.2 — RED commit before any implementation
// TDD targets: POST /api/suppliers, DELETE /api/suppliers/[id]
import { describe, it } from 'vitest'

describe('POST /api/suppliers', () => {
  it.todo('creates a supplier when called by a Member role user')
  it.todo('returns 401 when not authenticated')
})

describe('DELETE /api/suppliers/[id]', () => {
  it.todo('returns 403 when called by a Member role user')
  it.todo('soft-deletes supplier (sets status=inactive) when called by Admin')
  it.todo('preserves linked contracts when supplier is soft-deleted')
})
