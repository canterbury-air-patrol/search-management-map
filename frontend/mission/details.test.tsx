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

let detailsState: ReturnType<typeof makeDetails>

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

// usePolling re-runs its callback immediately when the tab returns to
// visible, so a hide/show cycle forces a fresh /details/ fetch without
// waiting out the 10s interval - our stand-in for a background poll.
function triggerRepoll() {
  setVisibility('hidden')
  document.dispatchEvent(new Event('visibilitychange'))
  setVisibility('visible')
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  detailsState = makeDetails()
  setVisibility('visible')
  ;(smmGetJSON as Mock).mockImplementation((url: string, _data: unknown, success?: (d: unknown) => void) => {
    let data: unknown = {}
    if (url.includes('/details/')) data = detailsState
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
  it('leaves edit mode on a successful save', async () => {
    render(<MissionDetailPage missionId={1} />)

    await userEvent.click(await screen.findByText('IRD'))
    const input = screen.getByDisplayValue('IRD')
    await userEvent.clear(input)
    await userEvent.type(input, 'NewName')

    await userEvent.click(screen.getByRole('button', { name: 'Update' }))

    // The input is gone and the row is back to its display state (Delete
    // shown instead of Update/Cancel).
    expect(screen.queryByDisplayValue('NewName')).toBeNull()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('seeds a field from the latest props, not a stale snapshot, when re-opened', async () => {
    render(<MissionDetailPage missionId={1} />)
    await screen.findByText('ABC')

    // The code changes server-side while the field is closed.
    detailsState = { ...detailsState, external_references: [{ ...detailsState.external_references[0], code: 'XYZ' }] }
    triggerRepoll()
    await screen.findByText('XYZ')

    // Opening the code field shows the updated value, not the mount snapshot.
    await userEvent.click(screen.getByText('XYZ'))
    expect(screen.getByDisplayValue('XYZ')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('ABC')).toBeNull()
  })

  it('posts edited fields over the latest props, so an untouched field is not reverted', async () => {
    render(<MissionDetailPage missionId={1} />)
    await screen.findByText('ABC')

    // Code is updated by a background poll; the user never touches it.
    detailsState = { ...detailsState, external_references: [{ ...detailsState.external_references[0], code: 'XYZ' }] }
    triggerRepoll()
    await screen.findByText('XYZ')

    // Edit only the name, then save.
    await userEvent.click(screen.getByText('IRD'))
    const input = screen.getByDisplayValue('IRD')
    await userEvent.clear(input)
    await userEvent.type(input, 'NewName')
    await userEvent.click(screen.getByRole('button', { name: 'Update' }))

    // code is the freshly-polled XYZ, not the stale mount-time ABC.
    expect(smmPost).toHaveBeenCalledWith('/mission/1/externalreferences/50/', { name: 'NewName', code: 'XYZ', url: 'http://example/x', notes: 'note' }, expect.any(Function))
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
