import { describe, expect, it, vi } from 'vitest'

import { buildSwatchLabel } from './swatchLabel'

function makeOwner(color = '#3388ff') {
  return { color, colorPicker: vi.fn(), swatch: undefined as HTMLElement | undefined }
}

describe('buildSwatchLabel', () => {
  it('renders the name as text and appends a coloured swatch stored on the owner', () => {
    const owner = makeOwner('red')
    const label = buildSwatchLabel('Rescue 1', owner)

    expect(label.textContent).toContain('Rescue 1')
    expect(owner.swatch).toBeDefined()
    expect(label.contains(owner.swatch!)).toBe(true)
    expect(owner.swatch!.style.backgroundColor).not.toBe('')
  })

  it('treats the name as text, not markup (no HTML injection)', () => {
    const owner = makeOwner()
    const label = buildSwatchLabel('<img src=x onerror=alert(1)>', owner)

    expect(label.querySelector('img')).toBeNull()
    expect(label.textContent).toContain('<img src=x onerror=alert(1)>')
  })

  it('invokes the owner colorPicker when the swatch is clicked', () => {
    const owner = makeOwner()
    buildSwatchLabel('Rescue 1', owner)

    owner.swatch!.dispatchEvent(new MouseEvent('click'))

    expect(owner.colorPicker).toHaveBeenCalledTimes(1)
  })
})
