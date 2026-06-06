import { describe, expect, it } from 'vitest'

import { coordinateToLatLng, mapCoordinates } from './details'

describe('coordinateToLatLng', () => {
  it('maps GeoJSON [lon, lat] order to a {lat, lng} point', () => {
    expect(coordinateToLatLng([174.7, -41.3])).toEqual({ lat: -41.3, lng: 174.7 })
  })
})

describe('mapCoordinates', () => {
  it('converts a list of [lon, lat] pairs preserving order', () => {
    expect(
      mapCoordinates([
        [1, 2],
        [3, 4]
      ])
    ).toEqual([
      { lat: 2, lng: 1 },
      { lat: 4, lng: 3 }
    ])
  })
})
