/* Ambient types for the bespoke Leaflet controls registered in
 * frontend/Admin/admin.tsx and frontend/ImageUploader/ImageUploader.tsx. */
import 'leaflet'
import type { MissionId } from '../mission/MissionId'

declare module 'leaflet' {
  interface SMMAdminOptions extends ControlOptions {
    missionId: MissionId
  }
  interface ImageUploaderOptions extends ControlOptions {
    missionId: MissionId
  }

  namespace control {
    function smmadmin(opts: SMMAdminOptions): Control
    function imageuploader(opts: ImageUploaderOptions): Control
  }
}
