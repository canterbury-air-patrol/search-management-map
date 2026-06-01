/** Build a layer-control label that places the name text next to a
 *  coloured swatch. Clicking the swatch invokes the owner's
 *  colorPicker callback. The label is a DOM node, not an HTML string,
 *  so a name with HTML characters can't break the layer control or
 *  inject markup. The swatch is stored on the owner so updateColor
 *  can repaint it without rebuilding the label. */
export function buildSwatchLabel(name: string, owner: { color: string; colorPicker: () => void; swatch?: HTMLElement }): HTMLElement {
  const label = document.createElement('span')
  label.textContent = `${name} `

  const swatch = document.createElement('span')
  Object.assign(swatch.style, {
    width: '15px',
    height: '15px',
    display: 'inline-block',
    backgroundColor: owner.color
  })
  swatch.addEventListener('click', owner.colorPicker)
  owner.swatch = swatch

  label.appendChild(swatch)
  return label
}
