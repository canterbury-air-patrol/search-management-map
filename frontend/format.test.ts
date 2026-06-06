import { describe, it, expect } from 'vitest'

import { formatLocalDateTime } from './format'

describe('formatLocalDateTime', () => {
  it('returns an empty string for null or undefined', () => {
    expect(formatLocalDateTime(null)).toBe('')
    expect(formatLocalDateTime(undefined)).toBe('')
  })

  it('returns an empty string for an empty or unparseable value', () => {
    expect(formatLocalDateTime('')).toBe('')
    expect(formatLocalDateTime('not a date')).toBe('')
  })

  it('formats a valid ISO-8601 timestamp to a non-empty local string', () => {
    const out = formatLocalDateTime('2024-01-02T03:04:05Z')
    expect(out).not.toBe('')
    expect(out).toBe(new Date('2024-01-02T03:04:05Z').toLocaleString())
  })
})
