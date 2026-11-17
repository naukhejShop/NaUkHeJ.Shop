import { Check, Clock, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { FundStatus } from '@/lib/fixtures'

export function StatusBadge({ status }: { status: FundStatus }) {
  const map = {
    pending: { icon: Clock, label: 'Pending', cls: 'bg-primary/15 text-primary' },
    approved: { icon: Check, label: 'Added', cls: 'bg-success/15 text-success' },
    rejected: { icon: XCircle, label: 'Rejected', cls: 'bg-destructive/15 text-destructive' },
  }[status]
  return (
    <Badge variant="outline" className={cn('gap-1 border-transparent', map.cls)}>
      <map.icon className="size-3" /> {map.label}
    </Badge>
  )
}
