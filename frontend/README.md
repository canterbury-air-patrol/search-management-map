# Frontend

The browser code for Search Management Map. TypeScript + React, bundled by
esbuild, rendered into Django templates.

## Build pipeline

`esbuild.config.json` lists the entrypoints (`map.tsx`, `mission/list.tsx`,
etc.). `npm run build` runs esbuild and copies the output from `dist/` into
`map/static/` so Django's `{% static %}` template tag can serve it.

`npm run check` runs the gate (`tsc --noEmit` → `eslint --max-warnings 0` →
`prettier -c`). CI runs the same script on every PR.

## Page model

Every Django template injects a `<div id="..."></div>` and immediately calls
`window.createX(elementId, ...)` after the bundle for that page loads. Each
entrypoint registers its `createX` function on `window` via
`frontend/types/window-create.d.ts`, which keeps those globals typed.

`createX` calls `ReactDOM.createRoot(...)` and renders the page's root
function component into the injected div.

## Page shells

- `frontend/page-shell.ts` is the common Bootstrap-bundle import every entry
  pulls in. New entrypoints start with `import './page-shell'`.
- `frontend/leaflet-setup.ts` wires Leaflet's default marker icons. Import
  it once at the top of any Leaflet-using entry.
- `frontend/pretty.tsx` is a no-React entry that just pulls in the
  Bootstrap bundle — referenced by Django templates that only need form
  styling, not React.

## Polling

Most pages re-fetch their backing data on an interval. Use
`frontend/hooks/usePolling.ts` instead of hand-rolled `setInterval` (it
pauses when the tab is hidden and clears its timer on unmount).

```ts
const [missions, setMissions] = useState<MissionData[] | undefined>(undefined)
usePolling(async () => {
  const data = await smmGetJSON<{ missions: MissionData[] }>('/mission/list/', {})
  setMissions(data.missions)
}, 10000)
if (missions === undefined) return <Loading />
```

## AJAX

`frontend/ajax.ts` is the single network entry point. Never call `fetch()`
directly from a component.

| Helper                        | Body type                                        | Headers                                          |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `smmGet(url, params?)`        | none, params as querystring                      | `Accept: text/plain`                             |
| `smmGetJSON<T>(url, params?)` | none                                             | `Accept: application/json`                       |
| `smmPost(url, data)`          | object → form, FormData/URLSearchParams verbatim | `X-CSRFToken`                                    |
| `smmPatch(url, data)`         | JSON                                             | `X-CSRFToken` + `Content-Type: application/json` |
| `smmDelete(url)`              | none                                             | `X-CSRFToken`                                    |

Mutating helpers (`smmPost` / `smmPatch` / `smmDelete`) attach the
`X-CSRFToken` header via `csrfHeaders()`. A 30 s timeout applies to
ordinary requests; passing a `FormData` to `smmPost` disables the timeout
(uploads can take longer).

## Leaflet integration

`frontend/smmmap.tsx` defines `SMMRealtime` — the base class for
leaflet-realtime feature collections. Subclasses override `getUrl()` and
optionally `featureOptions()` to add `updateFeature`, `pointToLayer`, or a
non-pk `getFeatureId`. Concrete subclasses live next to their feature
domain (`asset/map.tsx`, `user/map.tsx`, `image/map.tsx`,
`marine/vectors.tsx`, `search/map.tsx`, `usergeo/base.tsx`).

Per-feature popups render React into the layer's popup container; see
`frontend/usergeo/base.tsx` and `frontend/search/map.tsx` for the pattern.
Each popup tracks its React root on the cached feature instance so a stale
root cannot leak when the feature is recreated mid-tick.

## Map dialogs

`frontend/components/renderInLeafletDialog.tsx` wraps a
`@canterbury-air-patrol/leaflet-dialog` instance around a React tree.
Adders and the colour-picker route through it so the dialog/root lifecycle
is consistent.

## Adder controls

The four `*Adder` controls (POI, Line, Polygon, Search) plus
`ImageUploader` and the Admin gear are Leaflet bar controls built by
`frontend/components/iconControl.ts`. Each adder is two files: a `.tsx`
that defines the control + opens the dialog, and a `*Dialog.tsx` that
holds the React form.

## Types

- `frontend/mission/MissionId.ts` — `type MissionId = number | 'current' | 'all'`
  with an `isSpecificMission` type guard. Use it instead of inline string
  comparisons.
- `frontend/geometry/details.tsx` exports the discriminated
  `GeometryJSON` union. Switch on `geometry.type` and TypeScript narrows
  the `coordinates` shape.
- `frontend/types/*.d.ts` carries the vendor module augmentations
  (leaflet-realtime, leaflet-dialog, the SMM controls, asset module
  declarations for CSS/PNG, and the `Window.createX` global table).

## Known gotchas

- The 30 s default AJAX timeout aborts long requests. Pass a `FormData` to
  `smmPost` for uploads or pass `null` explicitly via the
  `timeoutMs` parameter of `request`.
- `usePolling` re-reads `fn` via a ref on each tick; the dependency array
  intentionally drops `fn`. Don't wrap it in `useCallback`.
- `pretty.tsx` is intentionally a side-effect-only entry. Don't delete it
  unless you also remove the Django templates that load `pretty.js`.
