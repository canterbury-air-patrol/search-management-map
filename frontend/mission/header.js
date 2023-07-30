import { Table } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'

import { MissionListRow } from './list'

class MissionHeader extends React.Component {
  render () {
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
MissionHeader.propTypes = {
  mission: PropTypes.object.isRequired
}

export { MissionHeader }
