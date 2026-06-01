import '../page-shell'
import { useState } from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON } from '../ajax'
import { SMMObjectDetails } from '../SMMObjects/details'
import { GeometryPoints, GeometryJSON } from '../geometry/details'
import { GeoJsonMap } from '../geomap'
import { usePolling } from '../hooks/usePolling'

interface SMMUserGeoObjectData {
  label: string
  created_at: string
  created_by: string
}

function UserGeoDetails({ data }: { data: SMMUserGeoObjectData }) {
  return (
    <SMMObjectDetails data={data}>
      <tr key="label">
        <td>Label:</td>
        <td>{data.label}</td>
      </tr>
    </SMMObjectDetails>
  )
}

interface UserGeoDetailsPageProps {
  userGeoId: number
}

function UserGeoDetailsPage({ userGeoId }: UserGeoDetailsPageProps) {
  const [data, setData] = useState<SMMUserGeoObjectData | undefined>(undefined)
  const [geometry, setGeometry] = useState<GeometryJSON | undefined>(undefined)

  usePolling(async () => {
    type Response = {
      features: { properties: SMMUserGeoObjectData; geometry: GeometryJSON }[]
    }
    const resp = await smmGetJSON<Response>(`/data/usergeo/${userGeoId}/`, {})
    setData(resp.features[0].properties)
    setGeometry(resp.features[0].geometry)
  }, 10000)

  return (
    <div>
      {data && <UserGeoDetails key="details" data={data} />}
      {geometry && (
        <>
          <GeometryPoints key="points" geometry={geometry} />
          <GeoJsonMap key="map" geometry={geometry} />
        </>
      )}
    </div>
  )
}

function createUserGeoDetailsPage(elementId: string, missionId: number, userGeoId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(<UserGeoDetailsPage userGeoId={userGeoId} />)
}
export { UserGeoDetailsPage, createUserGeoDetailsPage }

window.createUserGeoDetailsPage = createUserGeoDetailsPage
