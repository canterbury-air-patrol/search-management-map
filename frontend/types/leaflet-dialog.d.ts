/* Minimal typings for @canterbury-air-patrol/leaflet-dialog. The plugin
 * attaches L.control.dialog as a module side-effect and the corresponding
 * Control.Dialog subclass on L.Control. Refine the option/method surface
 * as more of the plugin is exercised. */
import 'leaflet'

declare module 'leaflet' {
  namespace Control {
    interface DialogOptions extends ControlOptions {
      initOpen?: boolean
      size?: [number, number]
      maxSize?: [number, number]
      minSize?: [number, number]
      anchor?: [number, number]
    }

    interface Dialog extends Control {
      setContent(content: HTMLElement | string): this
      setLocation(location: [number, number]): this
      setSize(size: [number, number]): this
      hideClose(): this
      showClose(): this
      open(): this
      close(): this
      show(): this
      destroy(): this
      lock(): this
      unlock(): this
      freeze(): this
      unfreeze(): this
    }
  }

  namespace control {
    function dialog(options?: Control.DialogOptions): Control.Dialog
  }
}
