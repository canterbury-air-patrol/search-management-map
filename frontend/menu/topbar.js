import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import { Nav, Navbar, NavbarBrand } from 'react-bootstrap'

class SMMTopBar extends React.Component {
  render() {
    return (
      <Navbar expand="lg" bg="secondary" data-bs-theme="dark" collapseOnSelect fixed={top}>
        <NavbarBrand href="https://github.com/canterbury-air-patrol/search-management-map/">Search Management Map</NavbarBrand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav>
            <Nav.Link href="/">Missions</Nav.Link>
            <Nav.Link href="/organization/">Organizations</Nav.Link>
            <Nav.Link href="/assets/">Assets</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }
}

class SMMMissionTopBar extends React.Component {
  render() {
    return (
      <Navbar bg="secondary" data-bs-theme="dark">
        <Nav>
          <Nav.Link href="/">Mission List</Nav.Link>
          <Nav.Link href={`/mission/${this.props.missionId}/details/`}>Details</Nav.Link>
          <Nav.Link href={`/mission/${this.props.missionId}/map/`}>Map</Nav.Link>
          <Nav.Link href={`/mission/${this.props.missionId}/timeline/`}>Timeline</Nav.Link>
          <Nav.Link href={`/mission/${this.props.missionId}/sar/marine/sac/`}>Search Area Calculator</Nav.Link>
        </Nav>
      </Navbar>
    )
  }
}
SMMMissionTopBar.propTypes = {
  missionId: PropTypes.number.isRequired
}

function createSMMMissionTopBar(elementId, missionId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<SMMMissionTopBar missionId={missionId} />)
}

globalThis.createSMMMissionTopBar = createSMMMissionTopBar

class SMMOrganizationTopBar extends React.Component {
  render() {
    return (
      <Navbar bg="secondary" data-bs-theme="dark">
        <Nav>
          <Nav.Link href="/organization/">Organization List</Nav.Link>
          <Nav.Link href={`/organization/${this.props.organizationId}/`}>Details</Nav.Link>
          <Nav.Link href={`/organization/${this.props.organizationId}/radio/operator/`}>Radio Operator</Nav.Link>
        </Nav>
      </Navbar>
    )
  }
}
SMMOrganizationTopBar.propTypes = {
  organizationId: PropTypes.number.isRequired
}

function createSMMOrganizationTopBar(elementId, organizationId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<SMMMissionTopBar organizationId={organizationId} />)
}

globalThis.createSMMOrganizationTopBar = createSMMOrganizationTopBar

export { SMMTopBar, SMMMissionTopBar, SMMOrganizationTopBar }
