import { ReactElement, ReactNode } from 'react'
import { Table } from 'react-bootstrap'

import { formatLocalDateTime } from '../format'

interface SMMObjectData {
  created_at: string
  created_by: string
  deleted_at?: string
  deleted_by?: string
  replaced_at?: string
  replaced_by?: string
}

/** Common row set every SMM object detail page shows above its
 *  model-specific rows: created/deleted/replaced metadata. */
function commonRows(data: SMMObjectData): ReactElement[] {
  const rows: ReactElement[] = [
    <tr key="created_at">
      <td>Created:</td>
      <td>{formatLocalDateTime(data.created_at)}</td>
    </tr>,
    <tr key="created_by">
      <td>Creator:</td>
      <td>{data.created_by}</td>
    </tr>
  ]
  if (data.deleted_at) {
    rows.push(
      <tr key="deleted_at">
        <td>Deleted:</td>
        <td>{formatLocalDateTime(data.deleted_at)}</td>
      </tr>,
      <tr key="deleted_by">
        <td>Deleted By:</td>
        <td>{data.deleted_by}</td>
      </tr>
    )
  }
  if (data.replaced_at) {
    rows.push(
      <tr key="replaced_at">
        <td>Replaced:</td>
        <td>{formatLocalDateTime(data.replaced_at)}</td>
      </tr>,
      <tr key="replaced_by">
        <td>Replacement:</td>
        <td>{data.replaced_by}</td>
      </tr>
    )
  }
  return rows
}

interface SMMObjectDetailsProps {
  data: SMMObjectData
  /** Model-specific rows appended after the common metadata. */
  children?: ReactNode
}

function SMMObjectDetails({ data, children }: SMMObjectDetailsProps) {
  return (
    <Table responsive>
      <tbody>
        {commonRows(data)}
        {children}
      </tbody>
    </Table>
  )
}

export { SMMObjectDetails, SMMObjectData }
