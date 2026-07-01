import { describe, expect, it } from 'vitest'

import { assetMetadataUrl } from './map'

describe('asset map helpers', () => {
  it('builds metadata URLs for specific and aggregate mission maps', () => {
    expect(assetMetadataUrl(7)).toBe('/mission/7/assets/?include_removed=true')
    expect(assetMetadataUrl('current')).toBe('/mission/current/assets/?include_removed=true')
    expect(assetMetadataUrl('all')).toBe('/mission/all/assets/?include_removed=true')
  })
})
