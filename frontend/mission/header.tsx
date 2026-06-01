import { Table } from 'react-bootstrap'

import { MissionListRow } from './list'
import { MissionData } from './types'

interface MissionHeaderProps {
  mission: MissionData
}

function MissionHeader({ mission }: MissionHeaderProps) {
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
        <MissionListRow mission={mission} showButtons={false} showClosed={true} />
      </tbody>
    </Table>
  )
}

export { MissionHeader }
