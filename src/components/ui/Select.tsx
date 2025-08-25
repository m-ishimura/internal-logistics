import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  help?: string
  options?: SelectOption[]
  children?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, help, options, children, className = '', ...props }, ref) => {
    const selectClasses = ['form-select', error && 'border-red-500', className]
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
        <select
          ref={ref}
          className={selectClasses}
          {...props}
        >
          {options ? (
            options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
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

Select.displayName = 'Select'