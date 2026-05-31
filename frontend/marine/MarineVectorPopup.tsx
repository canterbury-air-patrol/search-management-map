import { PopupDataList, PopupButtonGroup, ButtonItem } from '../popup'

interface Props {
  pk: number
  missionId: number | string
  onDelete: () => void
}

export function MarineVectorPopup({ pk, missionId, onDelete }: Props) {
  const items = [{ label: 'Total Drift Vector', value: String(pk) }]
  const buttons: ButtonItem[] = []
  if (missionId !== 'current' && missionId !== 'all') {
    buttons.push({ label: 'Delete', btnClass: 'btn-danger', onclick: onDelete })
  }
  return (
    <div>
      <PopupDataList items={items} dlClass="row" />
      {buttons.length > 0 && <PopupButtonGroup buttons={buttons} />}
    </div>
  )
}
