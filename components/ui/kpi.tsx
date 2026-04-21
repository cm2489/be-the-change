import * as React from 'react'
import { cn } from '@/lib/utils'

export interface KpiProps extends React.HTMLAttributes<HTMLDivElement> {
  value: React.ReactNode
  label: string
  sub?: string
}

export function Kpi({ value, label, sub, className, ...props }: KpiProps) {
  return (
    <div className={cn('kpi', className)} {...props}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
