import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'

vi.mock('../page-shell', () => ({}))
vi.mock('../ajax', () => ({
  smmGetJSON: vi.fn(),
  smmPost: vi.fn(() => Promise.resolve('')),
  smmDelete: vi.fn(() => Promise.resolve(''))
}))

import { smmGetJSON, smmPost } from '../ajax'
import { OrganizationAssetAdd } from './details'

function mockAssets(assets: Array<{ id: number; name: string }>) {
  ;(smmGetJSON as Mock).mockResolvedValue({ assets })
}

beforeEach(() => {
  mockAssets([])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('OrganizationAssetAdd', () => {
  it('does not POST when no asset is selected (empty list)', async () => {
    render(<OrganizationAssetAdd organizationId={3} />)
    // Let the mount poll settle (it resolves to an empty asset list).
    await Promise.resolve()

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(smmPost).not.toHaveBeenCalled()
  })

  it('seeds the select with the first asset and POSTs it on Add', async () => {
    mockAssets([
      { id: 7, name: 'Boat' },
      { id: 8, name: 'RHIB' }
    ])
    render(<OrganizationAssetAdd organizationId={3} />)

    const select = (await screen.findByRole('combobox')) as HTMLSelectElement
    await screen.findByRole('option', { name: 'Boat' })
    expect(select.value).toBe('7')

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(smmPost).toHaveBeenCalledWith('/organization/3/assets/7/', {})
  })

  it('is controlled: changing the selection updates the value and what is POSTed', async () => {
    mockAssets([
      { id: 7, name: 'Boat' },
      { id: 8, name: 'RHIB' }
    ])
    render(<OrganizationAssetAdd organizationId={3} />)

    const select = (await screen.findByRole('combobox')) as HTMLSelectElement
    await screen.findByRole('option', { name: 'RHIB' })

    await userEvent.selectOptions(select, '8')
    expect(select.value).toBe('8')

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(smmPost).toHaveBeenCalledWith('/organization/3/assets/8/', {})
  })
})
