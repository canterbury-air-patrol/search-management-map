import { Table } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'

class SMMObjectDetails extends React.Component {
  renderCreatedDeletedReplaced(tableRows, data) {
    tableRows.push(
      <tr key="created_at">
        <td>Created:</td>
        <td>{new Date(data.created_at).toLocaleString()}</td>
      </tr>
    )
    tableRows.push(
      <tr key="created_by">
        <td>Creator:</td>
        <td>{data.created_by}</td>
      </tr>
    )
    if (data.deleted_at !== null) {
      tableRows.push(
        <tr key="deleted_at">
          <td>Deleted:</td>
          <td>{new Date(data.deleted_at).toLocaleString()}</td>
        </tr>
      )
      tableRows.push(
        <tr key="deleted_by">
          <td>Deleted By:</td>
          <td>{data.deleted_by}</td>
        </tr>
      )
    }
    if (data.replaced_at) {
      tableRows.push(
        <tr key="replaced_at">
          <td>Replaced:</td>
          <td>{new Date(data.replaced_at).toLocaleString()}</td>
        </tr>
      )
      tableRows.push(
        <tr key="replaced_by">
          <td>Replacement:</td>
          <td>{data.replaced_by}</td>
        </tr>
      )
    }
  }

  renderModelSpecificData() {}

  render() {
    const data = this.props.data
    const tableRows = []

    this.renderCreatedDeletedReplaced(tableRows, data)
    this.renderModelSpecificData(tableRows, data)

    return (
      <Table responsive>
        <tbody>{tableRows}</tbody>
      </Table>
    )
  }
}
SMMObjectDetails.propTypes = {
  data: PropTypes.object.isRequired
}

export { SMMObjectDetails }
