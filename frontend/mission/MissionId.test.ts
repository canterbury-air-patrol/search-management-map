import { describe, expect, it } from 'vitest'

import { isSpecificMission } from './MissionId'

describe('isSpecificMission', () => {
  it('is true for a numeric mission id', () => {
    expect(isSpecificMission(0)).toBe(true)
    expect(isSpecificMission(42)).toBe(true)
  })

  it('is false for the aggregate sentinels', () => {
    expect(isSpecificMission('current')).toBe(false)
    expect(isSpecificMission('all')).toBe(false)
  })
})
