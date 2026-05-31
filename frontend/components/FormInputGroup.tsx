import React from 'react'

interface Props {
  label: string
  children: React.ReactNode
}

export function FormInputGroup({ label, children }: Props) {
  return (
    <div className="input-group input-group-sm mb-3">
      <span className="input-group-text">{label}</span>
      {children}
    </div>
  )
}
