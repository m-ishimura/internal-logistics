import { ReactNode, HTMLAttributes } from 'react'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info'
  children: ReactNode
}

export const Alert = ({ variant = 'info', children, className = '', ...props }: AlertProps) => {
  const variantClass = `alert-${variant}`
  const classes = ['alert', variantClass, className].filter(Boolean).join(' ')
  
  return (
    <div className={classes} role="alert" {...props}>
      {children}
    </div>
  )
}