import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AssetPopup } from './AssetPopup'

function valueFor(label: string): string | null | undefined {
  // PopupDataList renders each item as <dl><dt>label</dt><dd>value</dd></dl>.
  return screen.getByText(label).nextElementSibling?.textContent
}

describe('AssetPopup', () => {
  it('always shows the asset name and coordinates', () => {
    render(<AssetPopup assetName="Rescue 1" coords={[174.7, -41.3]} />)
    expect(valueFor('Asset')).toBe('Rescue 1')
    expect(screen.getByText('Lat')).toBeInTheDocument()
    expect(screen.getByText('Long')).toBeInTheDocument()
  })

  it('shows altitude 0 and heading 0 instead of hiding them as falsy', () => {
    render(<AssetPopup assetName="Rescue 1" coords={[174.7, -41.3]} alt={0} heading={0} />)
    expect(screen.getByText('Altitude')).toBeInTheDocument()
    expect(valueFor('Altitude')).toBe('0')
    expect(screen.getByText('Heading')).toBeInTheDocument()
    expect(valueFor('Heading')).toBe('0')
  })

  it('omits altitude and heading when they are not provided', () => {
    render(<AssetPopup assetName="Rescue 1" coords={[174.7, -41.3]} />)
    expect(screen.queryByText('Altitude')).toBeNull()
    expect(screen.queryByText('Heading')).toBeNull()
  })

  it('shows status and only shows status notes when non-empty', () => {
    const { rerender } = render(<AssetPopup assetName="Rescue 1" coords={[1, 2]} status={{ status: 'Available', notes: '' }} />)
    expect(valueFor('Status')).toBe('Available')
    expect(screen.queryByText('Status Notes')).toBeNull()

    rerender(<AssetPopup assetName="Rescue 1" coords={[1, 2]} status={{ status: 'Available', notes: 'fuelling' }} />)
    expect(valueFor('Status Notes')).toBe('fuelling')
  })
})
