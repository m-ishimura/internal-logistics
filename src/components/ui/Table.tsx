import { ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode
}

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
}

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode
}

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
}

export const Table = ({ children, className = '', ...props }: TableProps) => {
  const classes = ['table', className].filter(Boolean).join(' ')
  
  return (
    <div className="overflow-x-auto">
      <table className={classes} {...props}>
        {children}
      </table>
    </div>
  )
}

export const TableHeader = ({ children, className = '', ...props }: TableHeaderProps) => {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  )
}

export const TableBody = ({ children, className = '', ...props }: TableBodyProps) => {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

export const TableRow = ({ children, className = '', ...props }: TableRowProps) => {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  )
}

export const TableHead = ({ children, className = '', ...props }: TableHeadProps) => {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  )
}

export const TableCell = ({ children, className = '', ...props }: TableCellProps) => {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  )
}