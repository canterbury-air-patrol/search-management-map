import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('../page-shell', () => ({}))
vi.mock('../ajax', () => ({
  smmGetJSON: vi.fn(),
  smmPost: vi.fn(() => Promise.resolve(''))
}))

import { smmPost } from '../ajax'
import { MissionTimeLineEntryAdd } from './timeline'

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('MissionTimeLineEntryAdd', () => {
  it('uses the current time at submit when Now is selected', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-28T00:00:00.000Z'))
    render(<MissionTimeLineEntryAdd missionId={42} />)

    vi.setSystemTime(new Date('2026-06-28T00:05:00.000Z'))
    const messageInput = screen.getAllByRole('textbox')[0]
    if (!messageInput) throw new Error('Message input not found')
    fireEvent.change(messageInput, {
      target: { value: 'Manual timeline entry' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(smmPost).toHaveBeenCalledWith('/mission/42/timeline/', {
      timestamp: '2026-06-28T00:05:00.000Z',
      message: 'Manual timeline entry',
      url: ''
    })
  })
})
