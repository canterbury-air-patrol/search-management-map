import { Table } from 'react-bootstrap'

import React from 'react'

interface SMMObjectData {
  created_at: string
  created_by: string
  deleted_at?: string
  deleted_by?: string
  replaced_at?: string
  replaced_by?: string
}

interface SMMObjectDetailsProps {
  data: SMMObjectData
}

class SMMObjectDetails extends React.Component<SMMObjectDetailsProps, never> {
  renderCreatedDeletedReplaced(tableRows: React.JSX.Element[], data: SMMObjectData) {
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
    if (data.deleted_at) {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderModelSpecificData(tableRows: React.JSX.Element[], data: SMMObjectData) {}

  render() {
    const data = this.props.data
    const tableRows: React.JSX.Element[] = []

    this.renderCreatedDeletedReplaced(tableRows, data)
    this.renderModelSpecificData(tableRows, data)

    return (
      <Table responsive>
        <tbody>{tableRows}</tbody>
      </Table>
    )
  }
}

export { SMMObjectDetails, SMMObjectData }
