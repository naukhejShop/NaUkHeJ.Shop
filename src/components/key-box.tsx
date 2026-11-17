import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

export function KeyBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 p-3">
      <code className="flex-1 select-all font-mono text-lg font-bold tracking-wider text-primary">{value}</code>
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard?.writeText(value)
          setCopied(true)
          toast.success('Key copied')
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}
