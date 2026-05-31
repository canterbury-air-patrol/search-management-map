/* Window augmentation for the create* mount functions each entrypoint
 * exposes for the Django templates to call. Keeping this in one place
 * lets us drop the per-file '// @ts-expect-error: globalThis...'
 * comments and surface typos at compile time. */

declare global {
  interface Window {
    createAssetList: (elementId: string) => void
    createAssetTypeList: (elementId: string) => void
    createAssetUI: (elementId: string, assetId: number) => void
    createIconList: (elementId: string) => void
    createMarineSACTable: (elementId: string, missionId: number) => void
    createMissionAssetStatus: (elementId: string, asset: number, mission: number) => void
    createMissionDetails: (elementId: string, missionId: number) => void
    createMissionList: (elementId: string) => void
    createMissionTimeline: (elementId: string, missionId: number) => void
    createOrganizationDetails: (elementId: string, organizationId: number) => void
    createOrganizationList: (elementId: string) => void
    createRadioOperator: (elementId: string, organizationId: number) => void
    createSearchDetailsPage: (elementId: string, missionId: number, searchId: number) => void
    createSMMMissionTopBar: (elementId: string, missionId: number) => void
    createSMMOrganizationTopBar: (elementId: string, organizationId: number, showRadioOperator: boolean) => void
    createUserGeoDetailsPage: (elementId: string, missionId: number, userGeoId: number) => void
  }
}

export {}
