/* Untyped Canterbury Air Patrol vendor packages. The shapes below are
 * permissive: the implementations are React class components whose
 * state/methods we read but don't strictly type. Refine when a vendor
 * publishes proper d.ts files. */
declare module '@canterbury-air-patrol/marine-total-drift-vector' {
  import * as React from 'react'
  /* eslint-disable @typescript-eslint/no-explicit-any */
  export class MarineVectors<P = unknown, S = any> extends React.Component<P, S> {
    state: S & {
      LKPLat: number
      LKPLon: number
      selectedLeeway: { multiplier: any; modifier: any }
      currentVectors: any[]
      windVectors: any[]
    }
    distance: any
    bearing: any
    recalculate: () => void
    updateField: any
    updateCurrentData: any
    updateCurrentTimeFrom: any
    updateCurrentTimeTo: any
    updateLeewayData: any
    updateWindData: any
    updateWindTimeFrom: any
    updateWindTimeTo: any
    addCurrentVector: any
    addWindVector: any
  }
  export const MarineVectorsDisplay: React.ComponentType<any>
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

declare module '@canterbury-air-patrol/marine-search-area-coverage'
