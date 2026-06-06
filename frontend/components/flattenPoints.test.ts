import { describe, expect, it } from 'vitest'
import L from 'leaflet'

import { flattenPoints } from './flattenPoints'

describe('flattenPoints', () => {
  it('flattens an empty list to just the count', () => {
    expect(flattenPoints([])).toEqual({ points: 0 })
  })

  it('emits count plus per-point lat/lng keyed by index', () => {
    const points = [L.latLng(1.5, 2.5), L.latLng(-3, 4)]

    expect(flattenPoints(points)).toEqual({
      points: 2,
      point0_lat: 1.5,
      point0_lng: 2.5,
      point1_lat: -3,
      point1_lng: 4
    })
  })
})
