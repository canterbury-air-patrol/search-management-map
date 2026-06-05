import '../page-shell'
import { ReactElement, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import Collapsible from 'react-collapsible'
import { Button } from 'react-bootstrap'

import { formatLocalDateTime } from '../format'
import { smmGetJSON } from '../ajax'
import { SMMObjectDetails } from '../SMMObjects/details'
import { GeometryPoints, GeometryJSON } from '../geometry/details'
import { GeoJsonMap } from '../geomap'
import { ExpandingBoxSearch, SearchPattern, SectorSearch } from '@canterbury-air-patrol/sar-search-patterns'
import { SearchRunner } from '@canterbury-air-patrol/sar-search-runner'
import { usePolling } from '../hooks/usePolling'
import { SMMSearchObjectDetailsData } from './types'

function SearchDetails({ data }: { data: SMMSearchObjectDetailsData }) {
  const rows: ReactElement[] = [
    <tr key="search_type">
      <td>Type:</td>
      <td>{data.search_type}</td>
    </tr>,
    <tr key="created_for">
      <td>Asset Type:</td>
      <td>{data.created_for}</td>
    </tr>,
    <tr key="datum">
      <td>Created From:</td>
      <td>
        <Button href={`/data/usergeo/${data.datum}/`}>{data.datum}</Button>
      </td>
    </tr>
  ]

  if (data.inprogress_by && data.inprogress_at) {
    rows.push(
      <tr key="inprogress_at">
        <td>In Progress Since:</td>
        <td>{formatLocalDateTime(data.inprogress_at)}</td>
      </tr>,
      <tr key="inprogress_by">
        <td>In Progress By:</td>
        <td>{data.inprogress_by}</td>
      </tr>
    )
  }

  if (data.queued_at) {
    rows.push(
      <tr key="queued_at">
        <td>Queued:</td>
        <td>{formatLocalDateTime(data.queued_at)}</td>
      </tr>
    )
    if (data.queued_for_asset !== null) {
      rows.push(
        <tr key="queued_for">
          <td>Queued For:</td>
          <td>{data.queued_for_asset}</td>
        </tr>
      )
    }
  }

  if (data.sweep_width !== null) {
    rows.push(
      <tr key="sweep_width">
        <td>Sweep Width:</td>
        <td>{data.sweep_width}m</td>
      </tr>
    )
  }
  if (data.iterations !== null) {
    rows.push(
      <tr key="iterations">
        <td>Iterations:</td>
        <td>{data.iterations}</td>
      </tr>
    )
  }
  if (data.first_bearing !== null) {
    rows.push(
      <tr key="first_bearing">
        <td>First Bearing:</td>
        <td>{data.first_bearing}</td>
      </tr>
    )
  }
  if (data.width !== null) {
    rows.push(
      <tr key="width">
        <td>Width:</td>
        <td>{data.width}m</td>
      </tr>
    )
  }

  return <SMMObjectDetails data={data}>{rows}</SMMObjectDetails>
}

function createSearch(data: SMMSearchObjectDetailsData) {
  if (data.search_type === 'Sector') {
    return new SectorSearch(data.sweep_width, 3, 3, 0)
  }
  if (data.search_type === 'Expanding Box') {
    return new ExpandingBoxSearch(data.sweep_width, data.iterations || 1, data.first_bearing || 0)
  }
  return undefined
}

function SearchDetailsPage({ searchId }: { searchId: number }) {
  const [data, setData] = useState<SMMSearchObjectDetailsData | undefined>(undefined)
  const [search, setSearch] = useState<SearchPattern | undefined>(undefined)
  const [geometry, setGeometry] = useState<GeometryJSON | undefined>(undefined)

  usePolling(async () => {
    type Response = {
      features: { properties: SMMSearchObjectDetailsData; geometry: GeometryJSON }[]
    }
    const resp = await smmGetJSON<Response>(`/search/${searchId}/`, {})
    const feature = resp.features[0]
    if (!feature) return
    setData(feature.properties)
    setSearch(createSearch(feature.properties))
    setGeometry(feature.geometry)
  }, 10000)

  return (
    <div>
      {data && <SearchDetails key="details" data={data} />}
      {search && (
        <Collapsible key="runner" trigger="Runner">
          <SearchRunner search={search} />
        </Collapsible>
      )}
      {geometry && (
        <>
          <Collapsible key="points" trigger="Coordinates">
            <GeometryPoints geometry={geometry} />
          </Collapsible>
          <GeoJsonMap key="map" geometry={geometry} />
        </>
      )}
    </div>
  )
}

function createSearchDetailsPage(elementId: string, missionId: number, searchId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(<SearchDetailsPage searchId={searchId} />)
}
export { SearchDetails, createSearchDetailsPage }

window.createSearchDetailsPage = createSearchDetailsPage
