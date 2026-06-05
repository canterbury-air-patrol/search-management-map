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
          <th scope="col">Mission</th>
          <th scope="col">Created</th>
          <th scope="col">By</th>
          <th scope="col">Closed</th>
          <th scope="col">By</th>
        </tr>
      </thead>
      <tbody>
        <MissionListRow mission={mission} showButtons={false} showClosed={true} />
      </tbody>
    </Table>
  )
}

export { MissionHeader }
