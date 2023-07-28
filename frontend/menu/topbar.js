import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import { Nav, Navbar, NavbarBrand } from 'react-bootstrap'

class SMMTopBar extends React.Component {
  render () {
    return (
      <Navbar expand='lg' bg='secondary' data-bs-theme='dark'>
        <Nav>
          <NavbarBrand href='https://github.com/canterbury-air-patrol/search-management-map/'>Search Management Map</NavbarBrand>
          <Nav.Link href='/'>Missions</Nav.Link>
          <Nav.Link href='/organization/'>Organizations</Nav.Link>
          <Nav.Link href='/assets/'>Assets</Nav.Link>
        </Nav>
      </Navbar>
    )
  }
}

class SMMMissionTopBar extends React.Component {
  render () {
    return (
      <Navbar bg='secondary' data-bs-theme='dark'>
        <Nav>
        <Nav.Link href='/'>Mission List</Nav.Link>
        <Nav.Link href={ `/mission/${this.props.missionId}/details/` }>Details</Nav.Link>
        <Nav.Link href={ `/mission/${this.props.missionId}/map/` }>Map</Nav.Link>
        <Nav.Link href={ `/mission/${this.props.missionId}/timeline/` }>Timeline</Nav.Link>
        <Nav.Link href={ `/mission/${this.props.missionId}/sar/marine/sac/`}>Search Area Calculator</Nav.Link>
        </Nav>
      </Navbar>
    )
  }
}
SMMMissionTopBar.propTypes = {
  missionId: PropTypes.number.isRequired
}

function createSMMMissionTopBar (elementId, missionId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<SMMMissionTopBar missionId={missionId}/>)
}

globalThis.createSMMMissionTopBar = createSMMMissionTopBar

export { SMMTopBar, SMMMissionTopBar }
