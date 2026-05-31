import { CompactPicker, ColorResult } from 'react-color'

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
      <CompactPicker color={color} onChangeComplete={(c: ColorResult) => onColorChange(c.hex)} />
      <button className="btn btn-primary" onClick={onClose}>
        Done
      </button>
    </div>
  )
}
