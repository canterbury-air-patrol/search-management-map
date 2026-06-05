import { useEffect, useRef } from 'react'

/**
 * Run `fn` once on mount and then every `intervalMs` until the
 * component unmounts.
 *
 * The callback is captured in a ref so the effect only re-installs the
 * interval when `intervalMs` changes - callers don't need to wrap `fn`
 * in useCallback. Polling also pauses while the tab is hidden so a
 * minimised browser doesn't keep hitting the server.
 */
export function usePolling(fn: () => void | Promise<void>, intervalMs: number) {
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => {
    let cancelled = false
    // Skip a tick while a previous async callback is still pending so a
    // slow endpoint doesn't stack overlapping requests. Synchronous
    // callbacks complete within tick() and never set this.
    let inFlight = false

    const tick = () => {
      if (cancelled || inFlight) return
      let result: void | Promise<void>
      try {
        result = fnRef.current()
      } catch (err) {
        console.error('usePolling callback threw', err)
        return
      }
      if (result instanceof Promise) {
        inFlight = true
        result
          .catch((err) => {
            console.error('usePolling callback rejected', err)
          })
          .finally(() => {
            inFlight = false
          })
      }
    }

    tick()

    let id = document.visibilityState === 'visible' ? window.setInterval(tick, intervalMs) : 0

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id === 0) {
        tick()
        id = window.setInterval(tick, intervalMs)
      } else if (document.visibilityState !== 'visible' && id !== 0) {
        window.clearInterval(id)
        id = 0
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      if (id !== 0) window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [intervalMs])
}
