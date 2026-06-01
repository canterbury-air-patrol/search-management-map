/* Leaflet's Control.Layers.addOverlay accepts a string or an HTMLElement
 * at runtime, but @types/leaflet only types the string overload. Widen
 * the type so we can pass DOM nodes (e.g. labels with a colour swatch). */
import 'leaflet'

declare module 'leaflet' {
  namespace Control {
    interface Layers {
      addBaseLayer(layer: Layer, name: string | HTMLElement): this
      addOverlay(layer: Layer, name: string | HTMLElement): this
    }
  }
}
