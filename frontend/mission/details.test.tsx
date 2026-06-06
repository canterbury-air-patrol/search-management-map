import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'

vi.mock('../page-shell', () => ({}))
vi.mock('../ajax', () => ({
  smmGetJSON: vi.fn(),
  smmPost: vi.fn(),
  smmPatch: vi.fn(() => Promise.resolve('')),
  smmDelete: vi.fn(() => Promise.resolve(''))
}))

import { smmGetJSON, smmPost } from '../ajax'
import { MissionDetailPage } from './details'

function makeDetails() {
  return {
    mission: { id: 1, name: 'Op Kahu', started: '2024-01-01T00:00:00Z', creator: 'controller', description: 'desc', closed: null, closed_by: null },
    external_references: [{ id: 50, mission: 1, name: 'IRD', code: 'ABC', url: 'http://example/x', notes: 'note' }],
    mission_organizations: [],
    mission_users: [],
    mission_assets: [],
    admin: false,
    me: 'controller',
    can_add_organizations: false,
    can_add_users: false
  }
}

beforeEach(() => {
  const details = makeDetails()
  ;(smmGetJSON as Mock).mockImplementation((url: string, _data: unknown, success?: (d: unknown) => void) => {
    let data: unknown = {}
    if (url.includes('/details/')) data = details
    else if (url.includes('not_included')) data = { assets: [], organizations: [], users: [] }
    success?.(data)
    return Promise.resolve(data)
  })
  ;(smmPost as Mock).mockImplementation((_url: string, _data: unknown, success?: (d: unknown) => void) => {
    success?.('')
    return Promise.resolve('')
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('MissionDetailPage external references', () => {
  it('seeds the edit input from the current value when a field is opened', async () => {
    render(<MissionDetailPage missionId={1} />)
    await userEvent.click(await screen.findByText('IRD'))
    expect(screen.getByDisplayValue('IRD')).toBeInTheDocument()
  })

  it('saves only edited fields over the latest props and leaves edit mode on success', async () => {
    render(<MissionDetailPage missionId={1} />)

    await userEvent.click(await screen.findByText('IRD'))
    const input = screen.getByDisplayValue('IRD')
    await userEvent.clear(input)
    await userEvent.type(input, 'NewName')

    await userEvent.click(screen.getByRole('button', { name: 'Update' }))

    // Untouched fields carry their current prop values, not a blank/stale snapshot.
    expect(smmPost).toHaveBeenCalledWith('/mission/1/externalreferences/50/', { name: 'NewName', code: 'ABC', url: 'http://example/x', notes: 'note' }, expect.any(Function))

    // Editing ends on success: the input is gone and the row is back to its
    // display state (Delete button shown instead of Update/Cancel).
    expect(screen.queryByDisplayValue('NewName')).toBeNull()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('cancel discards the edit without posting', async () => {
    render(<MissionDetailPage missionId={1} />)

    await userEvent.click(await screen.findByText('IRD'))
    const input = screen.getByDisplayValue('IRD')
    await userEvent.clear(input)
    await userEvent.type(input, 'Discarded')

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(smmPost).not.toHaveBeenCalled()
    expect(screen.queryByDisplayValue('Discarded')).toBeNull()
    expect(screen.getByText('IRD')).toBeInTheDocument()
  })
})
