'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DeleteContractButton({ contractId }: { contractId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this contract? This cannot be undone.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/contracts')
      } else {
        const body = await res.json()
        alert(body?.error?.message ?? 'Failed to delete contract')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-red-500/20 text-red-400 hover:bg-red-500/10"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
      {loading ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
