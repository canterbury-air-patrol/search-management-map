import React from 'react'

interface Props {
  children: React.ReactNode
  className?: string
}

export function DialogActions({ children, className }: Props) {
  const classes = ['btn-group', className].filter(Boolean).join(' ')
  return <div className={classes}>{children}</div>
}
