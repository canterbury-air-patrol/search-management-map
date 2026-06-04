import '../page-shell'
import { useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table } from 'react-bootstrap'

import { smmGetJSON } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { Loading, LoadFailed } from '../components/Loading'

interface IconData {
  id: number
  name: string
  url: string
}

function IconListRow({ icon }: { icon: IconData }) {
  return (
    <tr key={icon.id}>
      <td key="name">{icon.name}</td>
      <td key="img">
        <img src={icon.url} alt={icon.name} />
      </td>
    </tr>
  )
}

function IconList({ icons }: { icons: IconData[] }) {
  return (
    <Table responsive>
      <thead>
        <tr key="heading">
          <th colSpan={5} align="center">
            Icons
          </th>
        </tr>
        <tr key="labels">
          <th>Name</th>
          <th>Image</th>
        </tr>
      </thead>
      <tbody>
        {icons.map((icon) => (
          <IconListRow key={icon.id} icon={icon} />
        ))}
      </tbody>
    </Table>
  )
}

function IconListPage() {
  const [icons, setIcons] = useState<IconData[] | undefined>(undefined)
  const [loadFailed, setLoadFailed] = useState(false)

  usePolling(async () => {
    try {
      const data = await smmGetJSON<{ icons: IconData[] }>('/icons/', {})
      setIcons(data.icons)
      setLoadFailed(false)
    } catch (e) {
      console.error('Failed to fetch icons:', e)
      setLoadFailed(true)
    }
  }, 10000)

  if (icons === undefined) {
    return loadFailed ? <LoadFailed /> : <Loading />
  }

  return (
    <div>
      <IconList icons={icons} />
    </div>
  )
}

function createIconList(elementId: string) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(
    <>
      <SMMTopBar />
      <IconListPage />
    </>
  )
}

window.createIconList = createIconList
