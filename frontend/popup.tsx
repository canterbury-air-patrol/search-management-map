import React from 'react'

interface DataItem {
  label: string
  value: string
}

interface ButtonItem {
  label: string
  btnClass: string
  onclick?: () => void
  href?: string
}

function PopupDataList({ items, dlClass }: { items: DataItem[]; dlClass: string }) {
  return (
    <>
      {items.map(({ label, value }) => (
        <dl key={label} className={dlClass}>
          <dt className="col-sm-3">{label}</dt>
          <dd className="col-sm-9">{value}</dd>
        </dl>
      ))}
    </>
  )
}

function PopupButtonGroup({ buttons }: { buttons: ButtonItem[] }) {
  return (
    <div className="btn-group-vertical">
      {buttons.map(({ label, btnClass, onclick, href }) =>
        href ? (
          <a key={label} href={href}>
            <button className={`btn ${btnClass}`}>{label}</button>
          </a>
        ) : (
          <button key={label} className={`btn ${btnClass}`} onClick={onclick}>
            {label}
          </button>
        )
      )}
    </div>
  )
}

export { PopupDataList, PopupButtonGroup }
export type { DataItem, ButtonItem }
