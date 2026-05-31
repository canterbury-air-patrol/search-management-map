import '../page-shell'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON } from '../ajax'

import { SMMObjectDetails } from '../SMMObjects/details'
import { GeometryPoints, GeometryJSON } from '../geometry/details'
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
  geometry?: GeometryJSON
}

class UserGeoDetailsPage extends React.Component<UserGeoDetailsPageProps, UserGeoDetailsPageState> {
  timer?: number
  constructor(props: UserGeoDetailsPageProps) {
    super(props)

    this.state = {
      data: undefined,
      geometry: undefined
    }
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  async updateData() {
    type GeoResponse = {
      features: {
        properties: SMMUserGeoObjectData
        geometry: GeometryJSON
      }[]
    }
    const data = await smmGetJSON<GeoResponse>(`/data/usergeo/${this.props.userGeoId}/`, {})
    this.setState({
      data: data.features[0].properties,
      geometry: data.features[0].geometry
    })
  }

  render() {
    const parts = []
    if (this.state.data) {
      parts.push(<UserGeoDetails key="details" data={this.state.data} />)
    }
    if (this.state.geometry) {
      parts.push(<GeometryPoints key="points" geometry={this.state.geometry} />)
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

window.createUserGeoDetailsPage = createUserGeoDetailsPage
