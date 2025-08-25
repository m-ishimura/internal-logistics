import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }, ref) => {
    const baseClass = 'btn'
    const variantClass = `btn-${variant}`
    const sizeClass = size === 'sm' ? 'text-sm px-4 py-2 min-h-[40px]' : 
                     size === 'lg' ? 'text-lg px-8 py-4 min-h-[56px]' : ''
    
    const classes = [baseClass, variantClass, sizeClass, className]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <div className="loading mr-2" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'