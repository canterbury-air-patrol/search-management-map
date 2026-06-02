/** Minimal "loading" indicator for top-level pages. Use while the
 *  initial data fetch is in flight so an empty result is visually
 *  distinct from data not yet arrived. */
export function Loading({ children = 'Loading ...' }: { children?: string }) {
  return <div className="text-muted">{children}</div>
}
