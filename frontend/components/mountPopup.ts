import * as ReactDOM from 'react-dom/client'
import type { ReactElement } from 'react'
import type L from 'leaflet'

interface MountedPopup {
  /** The DOM node the popup binds to. Don't touch its contents directly. */
  container: HTMLElement
  /** Replace the popup body with a new React element. Safe to call any
   *  number of times; reuses the same root and so the same DOM subtree. */
  rerender(element: ReactElement): void
  /** Drop the popup root explicitly. Normally called for you when the
   *  layer is removed; safe to call again afterwards (idempotent). */
  unmount(): void
}

/**
 * Render React into a popup attached to `layer`. Every feature-popup
 * creator used to hand-roll this dance with subtly different lifecycle
 * handling; consolidate it so the unmount is always idempotent, the
 * remove listener is always `once`, and a follow-up rerender reuses the
 * existing root instead of leaking a new one.
 */
export function mountPopup(layer: L.Layer, element: ReactElement, options?: L.PopupOptions): MountedPopup {
  const container = document.createElement('div')
  const root = ReactDOM.createRoot(container)
  root.render(element)
  layer.bindPopup(container, options)

  let unmounted = false
  const unmount = () => {
    if (unmounted) return
    unmounted = true
    root.unmount()
  }
  layer.once('remove', unmount)

  return {
    container,
    rerender: (next: ReactElement) => {
      if (!unmounted) root.render(next)
    },
    unmount
  }
}
