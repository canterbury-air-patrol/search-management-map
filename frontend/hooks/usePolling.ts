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

    const tick = () => {
      if (cancelled) return
      try {
        Promise.resolve(fnRef.current()).catch((err) => {
          console.error('usePolling callback rejected', err)
        })
      } catch (err) {
        console.error('usePolling callback threw', err)
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
