import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { SMMTopBar } from '../menu/topbar'

class IconListRow extends React.Component {
  render() {
    const icon = this.props.icon
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
IconListRow.propTypes = {
  icon: PropTypes.object.isRequired
}

class IconList extends React.Component {
  render() {
    const iconRows = []
    for (const iconIdx in this.props.icons) {
      const icon = this.props.icons[iconIdx]
      iconRows.push(<IconListRow key={icon.id} icon={icon} />)
    }
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
IconList.propTypes = {
  icons: PropTypes.array.isRequired
}

class IconListPage extends React.Component {
  constructor(props) {
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
    this.timer = null
  }

  async updateData() {
    await $.getJSON('/icons/', this.updateIcons)
  }

  updateIcons(data) {
    this.setState(function () {
      return {
        knownIcons: data.icons
      }
    })
  }

  render() {
    return (
      <div>
        <IconList icons={this.state.knownIcons} />
      </div>
    )
  }
}

function createIconList(elementId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(
    <>
      <SMMTopBar />
      <IconListPage />
    </>
  )
}

globalThis.createIconList = createIconList
