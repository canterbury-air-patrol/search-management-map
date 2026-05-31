import { MissionId } from '../mission/MissionId'
import '../page-shell'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { Nav, Navbar, NavbarBrand } from 'react-bootstrap'

class SMMTopBar extends React.Component<object, never> {
  render() {
    return (
      <Navbar expand="lg" bg="secondary" data-bs-theme="dark" collapseOnSelect>
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

interface SMMMissionTopBarProps {
  missionId: MissionId
}

class SMMMissionTopBar extends React.Component<SMMMissionTopBarProps, never> {
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

function createSMMMissionTopBar(elementId: string, missionId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(<SMMMissionTopBar missionId={missionId} />)
}

window.createSMMMissionTopBar = createSMMMissionTopBar

interface SMMOrganizationTopBarProps {
  organizationId: number
  showRadioOperator: boolean
}

class SMMOrganizationTopBar extends React.Component<SMMOrganizationTopBarProps, never> {
  constructor(props: SMMOrganizationTopBarProps) {
    super(props)
  }

  render() {
    const links = [
      <Nav.Link href="/organization/" key="orgList">
        Organization List
      </Nav.Link>,
      <Nav.Link href={`/organization/${this.props.organizationId}/`} key="orgDetails">
        Details
      </Nav.Link>
    ]
    if (this.props.showRadioOperator) {
      links.push(
        <Nav.Link href={`/organization/${this.props.organizationId}/radio/operator/`} key="orgRadioOperator">
          Radio Operator
        </Nav.Link>
      )
    }
    return (
      <Navbar bg="secondary" data-bs-theme="dark">
        <Nav>{links}</Nav>
      </Navbar>
    )
  }
}

function createSMMOrganizationTopBar(elementId: string, organizationId: number, showRadioOperator: boolean) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(<SMMOrganizationTopBar organizationId={organizationId} showRadioOperator={showRadioOperator} />)
}

window.createSMMOrganizationTopBar = createSMMOrganizationTopBar

export { SMMTopBar, SMMMissionTopBar, SMMOrganizationTopBar }
