import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { MissionId } from '../mission/MissionId'
import { SMMSearchObjectDetailsData } from './types'
import { SearchPopup } from './SearchPopup'

function searchData(overrides: Partial<SMMSearchObjectDetailsData> = {}): SMMSearchObjectDetailsData {
  return {
    pk: 42,
    created_at: '2026-06-28T00:00:00.000Z',
    created_by: 'test1',
    created_for: 'Aircraft',
    datum: 10,
    sweep_width: 200,
    search_type: 'Sector',
    ...overrides
  }
}

function renderPopup(search: SMMSearchObjectDetailsData, callbacks = {}, missionId: MissionId = 1) {
  const props = {
    onDelete: vi.fn(),
    onQueueDialog: vi.fn(),
    onUnqueue: vi.fn(),
    onAbandon: vi.fn(),
    ...callbacks
  }
  render(<SearchPopup search={search} missionId={missionId} status="Unassigned" {...props} />)
  return props
}

const inprogress = { inprogress_at: '2026-06-28T00:10:00.000Z', inprogress_by: 'asset_a' }

describe('SearchPopup', () => {
  it('shows Queue for an unqueued waiting search', () => {
    const props = renderPopup(searchData())

    fireEvent.click(screen.getByRole('button', { name: 'Queue' }))

    expect(props.onQueueDialog).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Unqueue' })).toBeNull()
  })

  it('shows Unqueue for a queued waiting search', () => {
    const props = renderPopup(searchData({ queued_at: '2026-06-28T00:05:00.000Z' }))

    fireEvent.click(screen.getByRole('button', { name: 'Unqueue' }))

    expect(props.onUnqueue).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Queue' })).toBeNull()
  })

  it('does not show queue controls for an in-progress search', () => {
    renderPopup(searchData({ queued_at: '2026-06-28T00:05:00.000Z', ...inprogress }))

    expect(screen.queryByRole('button', { name: 'Queue' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Unqueue' })).toBeNull()
  })

  it('shows Abandon Search for an in-progress search', () => {
    const props = renderPopup(searchData(inprogress))

    fireEvent.click(screen.getByRole('button', { name: 'Abandon Search' }))

    expect(props.onAbandon).toHaveBeenCalledTimes(1)
  })

  it('does not show Abandon Search for a not-started search', () => {
    renderPopup(searchData())

    expect(screen.queryByRole('button', { name: 'Abandon Search' })).toBeNull()
  })

  it('does not show Abandon Search for a completed search', () => {
    renderPopup(searchData({ ...inprogress, completed_at: '2026-06-28T00:20:00.000Z', completed_by: 'asset_a' }))

    expect(screen.queryByRole('button', { name: 'Abandon Search' })).toBeNull()
  })

  it('does not show Abandon Search in the all-missions view', () => {
    renderPopup(searchData(inprogress), {}, 'all')

    expect(screen.queryByRole('button', { name: 'Abandon Search' })).toBeNull()
  })
})
