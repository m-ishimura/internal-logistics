import { forwardRef, InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  help?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, help, className = '', ...props }, ref) => {
    const inputClasses = ['form-input', error && 'border-red-500', className]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="form-group">
        {label && (
          <label className="form-label" htmlFor={props.id}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
          value={props.value ?? ''}
        />
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        {help && !error && (
          <div className="form-help">
            {help}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'