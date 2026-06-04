import type { ReactNode } from 'react'

/** Minimal "loading" indicator for top-level pages. Use while the
 *  initial data fetch is in flight so an empty result is visually
 *  distinct from data not yet arrived. */
export function Loading({ children = 'Loading ...' }: { children?: ReactNode }) {
  return <div className="text-muted">{children}</div>
}

/** Companion to Loading: shown when the first fetch has failed so the
 *  page does not sit on "Loading ..." indefinitely. */
export function LoadFailed({ children = 'Failed to load. Retrying ...' }: { children?: ReactNode }) {
  return <div className="text-danger">{children}</div>
}
