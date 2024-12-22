import { Table } from 'react-bootstrap'

import React from 'react'

import { MissionListRow } from './list'
import { MissionData } from './types'

interface MissionHeaderProps {
  mission: MissionData
}

class MissionHeader extends React.Component<MissionHeaderProps, never> {
  render() {
    return (
      <Table responsive>
        <thead>
          <tr>
            <td>Misssion</td>
            <td>Created</td>
            <td>By</td>
            <td>Closed</td>
            <td>By</td>
          </tr>
        </thead>
        <tbody>
          <MissionListRow mission={this.props.mission} showButtons={false} showClosed={true} />
        </tbody>
      </Table>
    )
  }
}

export { MissionHeader }
