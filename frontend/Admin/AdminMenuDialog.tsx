interface Props {
  onCommand: () => void
  onClose: () => void
}

export function AdminMenuDialog({ onCommand, onClose }: Props) {
  return (
    <div className="btn-group-vertical">
      <button className="btn btn-light" onClick={onCommand}>
        Set Asset Command
      </button>
      <button className="btn btn-danger" onClick={onClose}>
        Close
      </button>
    </div>
  )
}
