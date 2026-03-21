// TODO: Implement in M1.3 — RED commit before any implementation
// TDD targets: POST /api/contracts, DELETE /api/contracts/[id]
import { describe, it } from 'vitest'

describe('POST /api/contracts', () => {
  it.todo('creates a contract with all valid fields')
  it.todo('returns 401 when not authenticated')
  it.todo('returns 422 when required fields missing (Zod validation)')
})

describe('DELETE /api/contracts/[id]', () => {
  it.todo('returns 403 when called by a Member role user')
  it.todo('deletes contract and returns 200 when called by Admin')
  it.todo('returns 401 when not authenticated')
})
