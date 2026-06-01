import '../page-shell'
import * as ReactDOM from 'react-dom/client'
import { Nav, Navbar, NavbarBrand } from 'react-bootstrap'

import { MissionId } from '../mission/MissionId'

function SMMTopBar() {
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

interface SMMMissionTopBarProps {
  missionId: MissionId
}

function SMMMissionTopBar({ missionId }: SMMMissionTopBarProps) {
  return (
    <Navbar bg="secondary" data-bs-theme="dark">
      <Nav>
        <Nav.Link href="/">Mission List</Nav.Link>
        <Nav.Link href={`/mission/${missionId}/details/`}>Details</Nav.Link>
        <Nav.Link href={`/mission/${missionId}/map/`}>Map</Nav.Link>
        <Nav.Link href={`/mission/${missionId}/timeline/`}>Timeline</Nav.Link>
        <Nav.Link href={`/mission/${missionId}/sar/marine/sac/`}>Search Area Calculator</Nav.Link>
      </Nav>
    </Navbar>
  )
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

function SMMOrganizationTopBar({ organizationId, showRadioOperator }: SMMOrganizationTopBarProps) {
  return (
    <Navbar bg="secondary" data-bs-theme="dark">
      <Nav>
        <Nav.Link href="/organization/" key="orgList">
          Organization List
        </Nav.Link>
        <Nav.Link href={`/organization/${organizationId}/`} key="orgDetails">
          Details
        </Nav.Link>
        {showRadioOperator && (
          <Nav.Link href={`/organization/${organizationId}/radio/operator/`} key="orgRadioOperator">
            Radio Operator
          </Nav.Link>
        )}
      </Nav>
    </Navbar>
  )
}

function createSMMOrganizationTopBar(elementId: string, organizationId: number, showRadioOperator: boolean) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(<SMMOrganizationTopBar organizationId={organizationId} showRadioOperator={showRadioOperator} />)
}

window.createSMMOrganizationTopBar = createSMMOrganizationTopBar

export { SMMTopBar, SMMMissionTopBar, SMMOrganizationTopBar }
