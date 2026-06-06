import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../page-shell', () => ({}))
vi.mock('../ajax', () => ({
  smmGet: vi.fn(() => Promise.resolve('')),
  smmGetJSON: vi.fn(() => Promise.resolve({})),
  smmPost: vi.fn(() => Promise.resolve('')),
  smmPatch: vi.fn(() => Promise.resolve('')),
  smmDelete: vi.fn(() => Promise.resolve())
}))

import { smmPost } from '../ajax'
import { AssetCommandView, AssetMissionDetails } from './ui'
import type { AssetCommandData, AssetFullStatusData } from './types'

afterEach(() => {
  vi.clearAllMocks()
})

const missionDetails = {
  asset_id: 5,
  mission_id: 10,
  mission_name: 'Op Kahu',
  queued_search_id: 99
}

describe('AssetMissionDetails - begin search gating', () => {
  it('offers Begin Search when a search is queued and current_search_id is null', () => {
    render(<AssetMissionDetails details={{ ...missionDetails, current_search_id: null } as unknown as AssetFullStatusData} />)
    expect(screen.getByRole('button', { name: 'Begin Search' })).toBeInTheDocument()
  })

  it('hides Begin Search while a current search is in progress', () => {
    render(<AssetMissionDetails details={{ ...missionDetails, current_search_id: 7 } as unknown as AssetFullStatusData} />)
    expect(screen.queryByRole('button', { name: 'Begin Search' })).toBeNull()
  })

  it('begins the queued search via POST and notifies the parent', async () => {
    const onAction = vi.fn()
    render(<AssetMissionDetails details={{ ...missionDetails, current_search_id: null } as unknown as AssetFullStatusData} onAction={onAction} />)

    await userEvent.click(screen.getByRole('button', { name: 'Begin Search' }))

    expect(smmPost).toHaveBeenCalledWith('/search/99/begin/', { asset_id: 5 })
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})

describe('AssetCommandView - response type select', () => {
  const lastCommand = {
    id: 3,
    action_txt: 'Goto',
    issued: null,
    issued_by: 'controller',
    reason: 'proceed',
    response: { set: null }
  } as unknown as AssetCommandData

  it('is controlled: the chosen response type is reflected and submitted', async () => {
    render(<AssetCommandView asset={5} lastCommand={lastCommand} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('Accepted')

    await userEvent.selectOptions(select, 'Unable')
    expect(select.value).toBe('Unable')

    await userEvent.click(screen.getByRole('button', { name: 'Respond' }))
    expect(smmPost).toHaveBeenCalledWith('/assets/5/command/', { command_id: 3, message: '', type: 'Unable' })
  })
})
