/* Ambient types for the bespoke Leaflet controls registered in
 * frontend/Admin/admin.js and frontend/ImageUploader/ImageUploader.js.
 * Both will get real typings when those files are converted to TS
 * (see todo/frontend/refactor-convert-js-to-typescript.md). */
import 'leaflet'

declare module 'leaflet' {
  interface SMMAdminOptions extends ControlOptions {
    missionId: number | string
  }
  interface ImageUploaderOptions extends ControlOptions {
    missionId: number | string
  }

  namespace control {
    function smmadmin(opts: SMMAdminOptions): Control
    function imageuploader(opts: ImageUploaderOptions): Control
  }
}
