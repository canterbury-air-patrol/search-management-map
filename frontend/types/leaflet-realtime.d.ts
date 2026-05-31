/* Minimal typings for leaflet-realtime. The plugin attaches L.realtime as
 * a module side-effect; this declaration augments the leaflet namespace
 * so tsc can resolve the calls. Feature payloads vary per call site and
 * are intentionally typed as `any` in the callbacks - call sites declare
 * their own feature shapes locally. */
import 'leaflet'

declare module 'leaflet' {
  interface RealtimeSource {
    url: string
    type?: string
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface RealtimeOptions {
    interval?: number
    color?: string
    onEachFeature?: (feature: any, layer: any) => any
    updateFeature?: (feature: any, oldLayer?: any) => any
    getFeatureId?: (feature: any) => number | string
    pointToLayer?: (feature: any, latlng: LatLng) => any
    style?: PathOptions | ((feature: any) => PathOptions)
    cache?: boolean
    start?: boolean
    removeMissing?: boolean
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  interface Realtime extends GeoJSON {
    start(): this
    stop(): this
    update(featureCollection?: unknown): this
    remove(featureId?: number | string): this
  }

  function realtime(source: RealtimeSource | string, options?: RealtimeOptions): Realtime
}
