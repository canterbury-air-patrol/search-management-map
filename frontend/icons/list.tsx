import '../page-shell'
import { useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table } from 'react-bootstrap'

import { smmGetJSON } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'

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
        <img src={icon.url} />
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
  const [icons, setIcons] = useState<IconData[]>([])

  usePolling(async () => {
    const data = await smmGetJSON<{ icons: IconData[] }>('/icons/', {})
    setIcons(data.icons)
  }, 10000)

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
