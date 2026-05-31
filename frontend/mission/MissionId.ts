/**
 * Mission identifier as it flows through the frontend. Either a numeric
 * mission id from the backend or one of two sentinel strings the map
 * entrypoint exposes for the cross-mission views.
 */
export type MissionId = number | 'current' | 'all'

/**
 * Narrow MissionId to a real numeric id. Useful in guards around
 * features that require a specific mission (search creation, image
 * upload, marine vectors, etc.) - they should not run when the user is
 * looking at the aggregate "current" / "all" views.
 */
export function isSpecificMission(id: MissionId): id is number {
  return typeof id === 'number'
}
