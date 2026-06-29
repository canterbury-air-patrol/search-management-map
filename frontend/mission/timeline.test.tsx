import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../page-shell', () => ({}))
vi.mock('../ajax', () => ({
  smmGetJSON: vi.fn(),
  smmPost: vi.fn(() => Promise.resolve('')),
  smmPatch: vi.fn((_url: string, _data: unknown, success?: (data: string) => void) => {
    success?.('')
    return Promise.resolve('')
  }),
  smmDelete: vi.fn((_url: string, success?: () => void) => {
    success?.()
    return Promise.resolve()
  })
}))

import { smmDelete, smmGetJSON, smmPatch, smmPost } from '../ajax'
import { MissionTimeLine, MissionTimeLineEntryAdd } from './timeline'

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

function timelineRows() {
  const table = screen.getByRole('table', { name: 'Timeline entries' })
  return within(table)
    .getAllByRole('row')
    .map((row) => row.textContent ?? '')
    .filter((text) => text.includes('entry'))
}

describe('MissionTimeLine', () => {
  it('defaults to newest first and can switch to oldest first', async () => {
    vi.mocked(smmGetJSON).mockResolvedValue({
      mission: {
        id: 42,
        name: 'Test mission',
        description: 'description',
        started: '2026-06-28T00:00:00.000Z',
        creator: 'test1',
        closed: '2026-06-28T02:00:00.000Z',
        admin: true
      },
      timeline: [
        {
          id: 1,
          timestamp: '2026-06-28T00:00:00.000Z',
          creator: 'test1',
          event_type: 'User defined Event',
          message: 'Old entry',
          url: ''
        },
        {
          id: 2,
          timestamp: '2026-06-28T01:00:00.000Z',
          creator: 'test1',
          event_type: 'User defined Event',
          message: 'New entry',
          url: ''
        }
      ]
    })

    render(<MissionTimeLine missionId={42} />)

    await screen.findByText('New entry')
    expect(smmGetJSON).toHaveBeenCalledWith('/mission/42/timeline/', { order: 'desc' })
    expect(timelineRows()[0]).toContain('New entry')

    await userEvent.selectOptions(screen.getByLabelText('Timeline sort order'), 'asc')

    expect(timelineRows()[0]).toContain('Old entry')
  })

  it('sends timeline filters to the endpoint', async () => {
    vi.mocked(smmGetJSON).mockResolvedValue({
      mission: {
        id: 42,
        name: 'Test mission',
        description: 'description',
        started: '2026-06-28T00:00:00.000Z',
        creator: 'test1',
        closed: '2026-06-28T02:00:00.000Z',
        admin: true
      },
      timeline: [
        {
          id: 1,
          timestamp: '2026-06-28T00:00:00.000Z',
          creator: 'test1',
          event_type: 'User defined Event',
          message: 'Medical note',
          url: ''
        }
      ]
    })

    render(<MissionTimeLine missionId={42} />)

    await screen.findByText('Medical note')
    await userEvent.type(screen.getByLabelText('User'), 'test1')
    await userEvent.type(screen.getByLabelText('Action'), 'User')
    await userEvent.type(screen.getByLabelText('Contains'), 'medical')

    const calls = vi.mocked(smmGetJSON).mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall?.[1]).toMatchObject({
      order: 'desc',
      user: 'test1',
      action: 'User',
      q: 'medical'
    })
  })

  it('updates editable manual timeline entries', async () => {
    vi.mocked(smmGetJSON).mockResolvedValue({
      mission: {
        id: 42,
        name: 'Test mission',
        description: 'description',
        started: '2026-06-28T00:00:00.000Z',
        creator: 'test1',
        admin: true
      },
      timeline: [
        {
          id: 7,
          timestamp: '2026-06-28T00:00:00.000Z',
          creator: 'test1',
          event_type_code: 'usr',
          event_type: 'User defined Event',
          message: 'Manual entry',
          url: '',
          can_edit: true
        }
      ]
    })

    render(<MissionTimeLine missionId={42} />)

    const row = (await screen.findByText('Manual entry')).closest('tr')
    if (!row) throw new Error('Timeline row not found')
    await userEvent.click(within(row).getByRole('button', { name: 'Edit' }))
    const messageInput = screen.getByDisplayValue('Manual entry')
    fireEvent.change(messageInput, { target: { value: 'Updated entry' } })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(smmPatch).toHaveBeenCalledWith(
      '/mission/42/timeline/7/',
      expect.objectContaining({
        message: 'Updated entry',
        url: ''
      }),
      expect.any(Function),
      expect.any(Function)
    )
  })

  it('shows validation feedback instead of silently ignoring invalid timeline edits', async () => {
    vi.mocked(smmGetJSON).mockResolvedValue({
      mission: {
        id: 42,
        name: 'Test mission',
        description: 'description',
        started: '2026-06-28T00:00:00.000Z',
        creator: 'test1',
        admin: true
      },
      timeline: [
        {
          id: 7,
          timestamp: '2026-06-28T00:00:00.000Z',
          creator: 'test1',
          event_type_code: 'usr',
          event_type: 'User defined Event',
          message: 'Manual entry',
          url: '',
          can_edit: true
        }
      ]
    })

    render(<MissionTimeLine missionId={42} />)

    const row = (await screen.findByText('Manual entry')).closest('tr')
    if (!row) throw new Error('Timeline row not found')
    await userEvent.click(within(row).getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByDisplayValue('Manual entry'), { target: { value: '' } })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid date/time and a message before saving.')
    expect(smmPatch).not.toHaveBeenCalled()
  })

  it('shows feedback when saving a timeline edit fails', async () => {
    vi.mocked(smmGetJSON).mockResolvedValue({
      mission: {
        id: 42,
        name: 'Test mission',
        description: 'description',
        started: '2026-06-28T00:00:00.000Z',
        creator: 'test1',
        admin: true
      },
      timeline: [
        {
          id: 7,
          timestamp: '2026-06-28T00:00:00.000Z',
          creator: 'test1',
          event_type_code: 'usr',
          event_type: 'User defined Event',
          message: 'Manual entry',
          url: '',
          can_edit: true
        }
      ]
    })
    vi.mocked(smmPatch).mockImplementationOnce((_url: string, _data: unknown, _success?: (data: string) => void, error?: (data?: unknown) => void) => {
      error?.({ error: 'bad_request' })
      return Promise.reject(new Error('HTTP 400'))
    })

    render(<MissionTimeLine missionId={42} />)

    const row = (await screen.findByText('Manual entry')).closest('tr')
    if (!row) throw new Error('Timeline row not found')
    await userEvent.click(within(row).getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the timeline entry. Check your input and try again.')
  })

  it('deletes editable manual timeline entries', async () => {
    vi.mocked(smmGetJSON).mockResolvedValue({
      mission: {
        id: 42,
        name: 'Test mission',
        description: 'description',
        started: '2026-06-28T00:00:00.000Z',
        creator: 'test1',
        admin: true
      },
      timeline: [
        {
          id: 7,
          timestamp: '2026-06-28T00:00:00.000Z',
          creator: 'test1',
          event_type_code: 'usr',
          event_type: 'User defined Event',
          message: 'Manual entry',
          url: '',
          can_edit: true
        }
      ]
    })

    render(<MissionTimeLine missionId={42} />)

    const row = (await screen.findByText('Manual entry')).closest('tr')
    if (!row) throw new Error('Timeline row not found')
    await userEvent.click(within(row).getByRole('button', { name: 'Delete' }))

    expect(smmDelete).toHaveBeenCalledWith('/mission/42/timeline/7/', expect.any(Function))
  })
})
