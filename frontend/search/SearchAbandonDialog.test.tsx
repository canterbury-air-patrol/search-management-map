import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('../ajax', () => ({
  smmGet: vi.fn(() => Promise.resolve('')),
  smmGetJSON: vi.fn(() => Promise.resolve({})),
  smmPost: vi.fn(() => Promise.resolve('')),
  smmPatch: vi.fn(() => Promise.resolve('')),
  smmDelete: vi.fn(() => Promise.resolve())
}))

import { smmPost } from '../ajax'
import { SearchAbandonDialog } from './SearchAbandonDialog'

function renderDialog() {
  const onClose = vi.fn()
  render(<SearchAbandonDialog searchPk={42} assetName="asset_a" onClose={onClose} />)
  return onClose
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('SearchAbandonDialog', () => {
  it('posts the default reason to the abandon endpoint', () => {
    renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Abandon Search' }))

    expect(smmPost).toHaveBeenCalledWith('/search/42/abandon/', { reason: 'Abandoned from map' }, expect.any(Function), expect.any(Function))
  })

  it('posts an edited reason', () => {
    renderDialog()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'weather' } })
    fireEvent.click(screen.getByRole('button', { name: 'Abandon Search' }))

    expect(smmPost).toHaveBeenCalledWith('/search/42/abandon/', { reason: 'weather' }, expect.any(Function), expect.any(Function))
  })

  it('closes when the post succeeds', () => {
    vi.mocked(smmPost).mockImplementationOnce((_url, _data, success) => {
      success?.('')
      return Promise.resolve('')
    })
    const onClose = renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Abandon Search' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the server error and stays open', () => {
    vi.mocked(smmPost).mockImplementationOnce((_url, _data, _success, error) => {
      error?.({ errors: { __all__: ['You do not have permission to command this asset'] } })
      return Promise.resolve('')
    })
    const onClose = renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Abandon Search' }))

    expect(screen.getByText('You do not have permission to command this asset')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows a generic error when the response is not json', () => {
    vi.mocked(smmPost).mockImplementationOnce((_url, _data, _success, error) => {
      error?.(undefined)
      return Promise.resolve('')
    })
    renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Abandon Search' }))

    expect(screen.getByText('Failed to abandon search')).toBeInTheDocument()
  })

  it('refuses an empty reason without posting', () => {
    renderDialog()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Abandon Search' }))

    expect(smmPost).not.toHaveBeenCalled()
    expect(screen.getByText('Reason is required')).toBeInTheDocument()
  })

  it('cancels without posting', () => {
    const onClose = renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(smmPost).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
