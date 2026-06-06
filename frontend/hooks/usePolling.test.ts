import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

import { usePolling } from './usePolling'

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

beforeEach(() => {
  vi.useFakeTimers()
  setVisibility('visible')
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('usePolling', () => {
  it('runs the callback once on mount', () => {
    const fn = vi.fn()
    renderHook(() => usePolling(fn, 1000))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('runs the callback again on every interval', async () => {
    const fn = vi.fn()
    renderHook(() => usePolling(fn, 1000))
    expect(fn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('skips ticks while a previous async callback is still in flight', async () => {
    const first = deferred()
    const fn = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(undefined)
    renderHook(() => usePolling(fn, 1000))
    expect(fn).toHaveBeenCalledTimes(1)

    // Two intervals elapse while the first call is unresolved: both skipped.
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(1)

    // Once it settles, the next tick runs again.
    first.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not block on a synchronous callback (no in-flight latch)', async () => {
    const fn = vi.fn()
    renderHook(() => usePolling(fn, 1000))

    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('pauses while the tab is hidden and resumes (with an immediate tick) when visible', async () => {
    const fn = vi.fn()
    renderHook(() => usePolling(fn, 1000))
    expect(fn).toHaveBeenCalledTimes(1)

    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(3000)
    expect(fn).toHaveBeenCalledTimes(1)

    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(fn).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('stops polling and removes its listener after unmount', async () => {
    const fn = vi.fn()
    const { unmount } = renderHook(() => usePolling(fn, 1000))
    expect(fn).toHaveBeenCalledTimes(1)

    unmount()
    await vi.advanceTimersByTimeAsync(3000)
    expect(fn).toHaveBeenCalledTimes(1)

    // A visibility change after unmount must not restart polling.
    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('logs and keeps polling when an async callback rejects', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fn = vi.fn(() => Promise.reject(new Error('boom')))
    renderHook(() => usePolling(fn, 1000))

    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(consoleError).toHaveBeenCalled()
  })

  it('logs and keeps polling when a synchronous callback throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fn = vi.fn(() => {
      throw new Error('sync boom')
    })
    renderHook(() => usePolling(fn, 1000))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
