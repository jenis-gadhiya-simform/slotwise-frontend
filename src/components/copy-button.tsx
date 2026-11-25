import { CheckIcon, CopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CopyButton({ value, label = 'Copy link' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      toast.error('Couldn’t copy. Select the link and copy it manually.')
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copied' : label}
    </Button>
  )
}
