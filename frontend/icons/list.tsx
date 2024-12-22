import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { SMMTopBar } from '../menu/topbar'

interface IconData {
  id: number
  name: string
  url: string
}

interface IconListRowProps {
  icon: IconData
}

class IconListRow extends React.Component<IconListRowProps, never> {
  render() {
    const { icon } = this.props
    const dataFields = []
    dataFields.push(<td key="name">{icon.name}</td>)
    dataFields.push(
      <td key="img">
        <img src={icon.url} />
      </td>
    )

    return <tr key={icon.id}>{dataFields}</tr>
  }
}

interface IconListProps {
  icons: IconData[]
}

class IconList extends React.Component<IconListProps, never> {
  render() {
    const iconRows = this.props.icons.map((icon) => <IconListRow key={icon.id} icon={icon} />)
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
        <tbody>{iconRows}</tbody>
      </Table>
    )
  }
}

interface IconListPageState {
  knownIcons?: IconData[]
}

class IconListPage extends React.Component<object, IconListPageState> {
  timer?: number
  constructor(props: object) {
    super(props)

    this.state = {
      knownIcons: []
    }

    this.updateIcons = this.updateIcons.bind(this)
  }

  componentDidMount() {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  async updateData() {
    await $.getJSON('/icons/', this.updateIcons)
  }

  updateIcons(data: { icons: IconData[] }) {
    this.setState(function () {
      return {
        knownIcons: data.icons
      }
    })
  }

  render() {
    if (this.state.knownIcons) {
      return (
        <div>
          <IconList icons={this.state.knownIcons} />
        </div>
      )
    }
    return <div></div>
  }
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

// @ts-expect-error: globalTime has no definition
globalThis.createIconList = createIconList
