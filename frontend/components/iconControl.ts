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
export function createIconControl(opts: IconControlOptions): L.Control {
  const Ctrl = L.Control.extend({
    options: { position: opts.position ?? 'topleft' },

    onAdd(map: L.Map) {
      const container = L.DomUtil.create('div', `${opts.cssPrefix}-container leaflet-bar`)
      const link = L.DomUtil.create('a', '', container)
      link.href = '#'
      link.title = opts.title

      const img = L.DomUtil.create('img', `${opts.cssPrefix}-marker`, link)
      img.src = opts.iconUrl
      img.alt = opts.title

      L.DomEvent.disableClickPropagation(link)
      L.DomEvent.on(link, 'click', L.DomEvent.stop)
      L.DomEvent.on(link, 'click', () => opts.onClick(map))

      return container
    },

    onRemove() {}
  })
  return new Ctrl()
}
