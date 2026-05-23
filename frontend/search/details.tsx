import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import React from 'react'
import * as ReactDOM from 'react-dom/client'
import Collapsible from 'react-collapsible'
import { Button } from 'react-bootstrap'

import { smmGetJSON } from '../ajax'

import { SMMObjectDetails } from '../SMMObjects/details'
import { GeometryPoints } from '../geometry/details'
import { GeoJsonMap } from '../geomap'
import { ExpandingBoxSearch, SectorSearch } from '@canterbury-air-patrol/sar-search-patterns'
import { SearchRunner } from '@canterbury-air-patrol/sar-search-runner'
import { SMMSearchObjectDetailsData } from './types'

class SearchDetails extends SMMObjectDetails {
  renderModelSpecificData(tableRows: React.JSX.Element[], data: SMMSearchObjectDetailsData) {
    tableRows.push(
      <tr key="search_type">
        <td>Type:</td>
        <td>{data.search_type}</td>
      </tr>
    )

    tableRows.push(
      <tr key="created_for">
        <td>Asset Type:</td>
        <td>{data.created_for}</td>
      </tr>
    )

    tableRows.push(
      <tr key="datum">
        <td>Created From:</td>
        <td>
          <Button href={`/data/usergeo/${data.datum}/`}>{data.datum}</Button>
        </td>
      </tr>
    )

    if (data.inprogress_by && data.inprogress_at) {
      tableRows.push(
        <tr key="inprogress_at">
          <td>In Progress Since:</td>
          <td>{new Date(data.inprogress_at).toLocaleString()}</td>
        </tr>
      )
      tableRows.push(
        <tr>
          <td>In Progress By:</td>
          <td>{data.inprogress_by}</td>
        </tr>
      )
    }

    if (data.queued_at) {
      tableRows.push(
        <tr key="queued_at">
          <td>Queued:</td>
          <td>{new Date(data.queued_at).toLocaleString()}</td>
        </tr>
      )
      if (data.queued_for_asset !== null) {
        tableRows.push(
          <tr key="queued_for">
            <td>Queued For:</td>
            <td>{data.queued_for_asset}</td>
          </tr>
        )
      }
    }

    if (data.sweep_width !== null) {
      tableRows.push(
        <tr key="sweep_width">
          <td>Sweep Width:</td>
          <td>{data.sweep_width}m</td>
        </tr>
      )
    }

    if (data.iterations !== null) {
      tableRows.push(
        <tr key="iterations">
          <td>Iterations:</td>
          <td>{data.iterations}</td>
        </tr>
      )
    }

    if (data.first_bearing !== null) {
      tableRows.push(
        <tr key="first_bearing">
          <td>First Bearing:</td>
          <td>{data.first_bearing}</td>
        </tr>
      )
    }

    if (data.width !== null) {
      tableRows.push(
        <tr key="width">
          <td>Width:</td>
          <td>{data.width}m</td>
        </tr>
      )
    }
  }
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

interface SearchDetailsPageProps {
  searchId: number
}

interface SearchDetailsPageState {
  data?: SMMSearchObjectDetailsData
  search?: SearchPattern
  geometry?: {
    type: string
    coordinates: [number, number] | [number, number][] | [number, number][][]
  }
}

class SearchDetailsPage extends React.Component<SearchDetailsPageProps, SearchDetailsPageState> {
  timer?: number
  constructor(props: SearchDetailsPageProps) {
    super(props)

    this.state = {
      data: undefined,
      search: undefined,
      geometry: undefined
    }
    this.updateDataResponse = this.updateDataResponse.bind(this)
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data: {
    features: {
      properties: SMMSearchObjectDetailsData
      geometry: {
        type: string
        coordinates: [number, number] | [number, number][] | [number, number][][]
      }
    }[]
  }) {
    const search = createSearch(data.features['0'].properties)
    this.setState({
      data: data.features['0'].properties,
      search,
      geometry: data.features['0'].geometry
    })
  }

  async updateData() {
    await smmGetJSON(`/search/${this.props.searchId}/`, {}, this.updateDataResponse)
  }

  render() {
    const parts = []
    if (this.state.data) {
      parts.push(<SearchDetails key="details" data={this.state.data} />)
    }
    if (this.state.search) {
      parts.push(
        <Collapsible key="runner" trigger="Runner">
          <SearchRunner search={this.state.search} />
        </Collapsible>
      )
    }
    if (this.state.geometry && this.state.geometry.coordinates) {
      parts.push(
        <Collapsible key="points" trigger="Coordinates">
          <GeometryPoints points={this.state.geometry.coordinates} />
        </Collapsible>
      )
      parts.push(<GeoJsonMap key="map" geometry={this.state.geometry} />)
    }
    return <div>{parts}</div>
  }
}

function createSearchDetailsPage(elementId: string, missionId: number, searchId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(<SearchDetailsPage searchId={searchId} />)
}
export { SearchDetails, createSearchDetailsPage }

// @ts-expect-error: globalThis has no definition
globalThis.createSearchDetailsPage = createSearchDetailsPage
