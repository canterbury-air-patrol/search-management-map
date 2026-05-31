import { AssetColorPicker } from './map'

interface Props {
  name: string
  color: string
  onColorChange: (color: string) => void
  onClose: () => void
}

export function ColorPickerDialog({ name, color, onColorChange, onClose }: Props) {
  return (
    <div>
      <div>Color Picker for {name}</div>
      <AssetColorPicker color={color} updateColor={onColorChange} />
      <button className="btn btn-primary" onClick={onClose}>
        Done
      </button>
    </div>
  )
}
