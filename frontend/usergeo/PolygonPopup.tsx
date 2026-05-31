import { MissionId, isSpecificMission } from '../mission/MissionId'
import { PopupDataList, PopupButtonGroup, ButtonItem } from '../popup'

interface Props {
  label: string
  pk: number
  missionId: MissionId
  onEdit: () => void
  onDelete: () => void
  onCreateSearch: () => void
}

export function PolygonPopup({ label, pk, missionId, onEdit, onDelete, onCreateSearch }: Props) {
  const items = [{ label: 'Polygon', value: label }]
  const buttons: ButtonItem[] = isSpecificMission(missionId)
    ? [
        { label: 'Edit', btnClass: 'btn-light', onclick: onEdit },
        { label: 'Delete', btnClass: 'btn-danger', onclick: onDelete },
        { label: 'Create Search', btnClass: 'btn-light', onclick: onCreateSearch },
        { label: 'Details', btnClass: 'btn-light', href: `/data/usergeo/${pk}/` }
      ]
    : []
  return (
    <div>
      <PopupDataList items={items} dlClass="polygon row" />
      {buttons.length > 0 && <PopupButtonGroup buttons={buttons} />}
    </div>
  )
}
