// TODO: Implement in M2.1 — RED commit before any implementation
// TDD target: getContractStatus() and getRiskColour() in lib/risk.ts
import { describe, it } from 'vitest'

describe('risk.ts', () => {
  describe('getContractStatus()', () => {
    it.todo('returns expired when end_date is in the past')
    it.todo('returns expiring when renewal_date is within notice_period_days')
    it.todo('returns active for all other cases')
  })

  describe('getRiskColour()', () => {
    it.todo('returns green when renewal_date > 60 days away')
    it.todo('returns amber when renewal_date within 60 days but outside notice period')
    it.todo('returns red when renewal_date within notice_period_days')
    it.todo('returns red when renewal_date is exactly today')
  })
})
