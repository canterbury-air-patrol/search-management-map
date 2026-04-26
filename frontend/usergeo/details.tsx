import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON } from '../ajax'

import { SMMObjectDetails } from '../SMMObjects/details'
import { GeometryPoints } from '../geometry/details'
import { GeoJsonMap } from '../geomap'

interface SMMUserGeoObjectData {
  label: string
  created_at: string
  created_by: string
}

class UserGeoDetails extends SMMObjectDetails {
  renderModelSpecificData(tableRows: React.JSX.Element[], data: SMMUserGeoObjectData) {
    tableRows.push(
      <tr key="label">
        <td>Label:</td>
        <td>{data.label}</td>
      </tr>
    )
  }
}

interface UserGeoDetailsPageProps {
  userGeoId: number
}

interface UserGeoDetailsPageState {
  data?: SMMUserGeoObjectData
  geometry?: {
    type: string
    coordinates: [number, number] | [number, number][] | [number, number][][]
  }
}

class UserGeoDetailsPage extends React.Component<UserGeoDetailsPageProps, UserGeoDetailsPageState> {
  timer?: number
  constructor(props: UserGeoDetailsPageProps) {
    super(props)

    this.state = {
      data: undefined,
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
      properties: SMMUserGeoObjectData
      geometry: {
        type: string
        coordinates: [number, number] | [number, number][] | [number, number][][]
      }
    }[]
  }) {
    this.setState({
      data: data.features['0'].properties,
      geometry: data.features['0'].geometry
    })
  }

  async updateData() {
    await smmGetJSON(`/data/usergeo/${this.props.userGeoId}/`, {}, this.updateDataResponse)
  }

  render() {
    const parts = []
    if (this.state.data) {
      parts.push(<UserGeoDetails key="details" data={this.state.data} />)
    }
    if (this.state.geometry && this.state.geometry.coordinates) {
      parts.push(<GeometryPoints key="points" points={this.state.geometry.coordinates} />)
      parts.push(<GeoJsonMap key="map" geometry={this.state.geometry} />)
    }
    return <div>{parts}</div>
  }
}

function createUserGeoDetailsPage(elementId: string, missionId: number, userGeoId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(<UserGeoDetailsPage userGeoId={userGeoId} />)
}
export { UserGeoDetailsPage, createUserGeoDetailsPage }

// @ts-expect-error: globalThis has no defintion
globalThis.createUserGeoDetailsPage = createUserGeoDetailsPage
