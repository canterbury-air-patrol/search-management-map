import { describe, expect, it } from 'vitest'

import { userNameFromProperty } from './types'
import { userPositionAddUrl, userPositionHistoryUrl, userPositionPayload } from './tracking'

describe('user position tracking helpers', () => {
  it('builds the specific-mission position update URL', () => {
    expect(userPositionAddUrl(7, 'test user')).toBe('/mission/7/data/user/test%20user/position/add/')
  })

  it('builds history URLs for specific and aggregate mission maps', () => {
    expect(userPositionHistoryUrl(7, 'test')).toBe('/mission/7/data/user/test/position/history/')
    expect(userPositionHistoryUrl('current', 'test')).toBe('/mission/current/data/users/test/position/history/')
    expect(userPositionHistoryUrl('all', 'test')).toBe('/mission/all/data/users/test/position/history/')
  })

  it('converts geolocation coordinates to the backend payload shape', () => {
    expect(
      userPositionPayload({
        latitude: -43.5,
        longitude: 172.5,
        altitude: 12,
        heading: 90
      })
    ).toEqual({ lat: -43.5, lon: 172.5, alt: 12, heading: 90 })
  })

  it('normalizes Django natural-key user properties', () => {
    expect(userNameFromProperty('test')).toBe('test')
    expect(userNameFromProperty(['test'])).toBe('test')
  })
})
