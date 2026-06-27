import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../page-shell', () => ({}))
vi.mock('../ajax', () => ({
  smmGetJSON: vi.fn(() => Promise.resolve({ missions: [] })),
  smmPost: vi.fn((_url: string, _data: unknown, success?: (data: unknown) => void) => {
    success?.('')
    return Promise.resolve('')
  })
}))

import { smmPost } from '../ajax'
import { MissionListRow } from './list'
import type { MissionData } from './types'

afterEach(() => {
  vi.clearAllMocks()
})

const activeMission = {
  id: 7,
  name: 'Op Kahu',
  started: '2024-01-01T00:00:00Z',
  creator: 'controller',
  admin: true
} as unknown as MissionData

function renderRow(mission: MissionData, onChanged?: () => void) {
  return render(
    <table>
      <tbody>
        <MissionListRow mission={mission} showButtons={true} showClosed={false} onChanged={onChanged} />
      </tbody>
    </table>
  )
}

describe('MissionListRow - close button', () => {
  it('closes the mission via POST and refreshes the list', async () => {
    const onChanged = vi.fn()
    renderRow(activeMission, onChanged)

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(smmPost).toHaveBeenCalledWith('/mission/7/close/', {}, expect.any(Function))
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  it('does not offer Close to non-admins', () => {
    renderRow({ ...activeMission, admin: false })
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('does not offer Close on an already-closed mission', () => {
    renderRow({ ...activeMission, closed: '2024-02-01T00:00:00Z' } as unknown as MissionData)
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })
})
