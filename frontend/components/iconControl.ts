import L from 'leaflet'

interface IconControlOptions {
  position?: L.ControlPosition
  iconUrl: string
  title: string
  cssPrefix: string
  onClick: (map: L.Map) => void
}

/**
 * Build a tiny Leaflet bar control whose only job is to render an icon
 * link and dispatch a click to the supplied callback. All adders
 * (POI / Line / Polygon / ImageUploader / Admin) share this shape, so
 * the boilerplate of L.Control.extend lives in one place.
 */
interface IconControlInstance {
  _link?: HTMLAnchorElement
  _activate?: (ev: Event) => void
  _onKeyDown?: (ev: Event) => void
}

export function createIconControl(opts: IconControlOptions): L.Control {
  const Ctrl = L.Control.extend({
    options: { position: opts.position ?? 'topleft' },

    onAdd(this: IconControlInstance, map: L.Map) {
      const container = L.DomUtil.create('div', `${opts.cssPrefix}-container leaflet-bar`)
      const link = L.DomUtil.create('a', '', container)
      link.href = '#'
      link.title = opts.title
      link.setAttribute('role', 'button')
      link.tabIndex = 0

      const img = L.DomUtil.create('img', `${opts.cssPrefix}-marker`, link)
      img.src = opts.iconUrl
      img.alt = opts.title

      const activate = (ev: Event) => {
        L.DomEvent.stop(ev)
        opts.onClick(map)
      }
      const onKeyDown = (ev: Event) => {
        const key = (ev as KeyboardEvent).key
        if (key === 'Enter' || key === ' ') activate(ev)
      }

      L.DomEvent.disableClickPropagation(link)
      L.DomEvent.on(link, 'click', activate)
      L.DomEvent.on(link, 'keydown', onKeyDown)

      this._link = link
      this._activate = activate
      this._onKeyDown = onKeyDown

      return container
    },

    onRemove(this: IconControlInstance) {
      if (this._link && this._activate && this._onKeyDown) {
        L.DomEvent.off(this._link, 'click', this._activate)
        L.DomEvent.off(this._link, 'keydown', this._onKeyDown)
        this._link = undefined
        this._activate = undefined
        this._onKeyDown = undefined
      }
    }
  })
  return new Ctrl()
}
