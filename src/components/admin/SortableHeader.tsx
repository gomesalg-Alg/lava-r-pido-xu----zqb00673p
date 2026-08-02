import type { ReactNode } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { SortState } from '@/hooks/use-sortable-data'

interface SortableHeaderProps {
  columnKey: string
  sortState: SortState
  onSort: (key: string) => void
  children: ReactNode
  className?: string
}

export function SortableHeader({
  columnKey,
  sortState,
  onSort,
  children,
  className,
}: SortableHeaderProps) {
  const isActive = sortState.key === columnKey
  const direction = isActive ? sortState.direction : null

  return (
    <TableHead
      className={cn(
        'bg-slate-800 font-bold text-white select-none cursor-pointer',
        'hover:bg-slate-800 focus:bg-slate-800 active:bg-slate-800',
        'outline-none focus-visible:outline-none focus-visible:ring-0',
        'pointer-events-auto',
        className,
      )}
      onClick={() => onSort(columnKey)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {direction === 'asc' && <ArrowUp className="w-3 h-3" />}
        {direction === 'desc' && <ArrowDown className="w-3 h-3" />}
      </span>
    </TableHead>
  )
}

interface StaticHeaderProps {
  children: ReactNode
  className?: string
}

export function StaticHeader({ children, className }: StaticHeaderProps) {
  return (
    <TableHead
      className={cn(
        'bg-slate-800 font-bold text-white select-none',
        'pointer-events-none',
        className,
      )}
    >
      {children}
    </TableHead>
  )
}
