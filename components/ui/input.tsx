import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hero?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hero, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(hero ? 'input-hero' : 'input', className)}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('field-label', className)} {...props} />
}
