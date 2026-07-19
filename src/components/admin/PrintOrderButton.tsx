import { Link } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PrintOrderButton({ orderId, className }: { orderId: string; className?: string }) {
  return (
    <Button variant="outline" className={cn(className)} asChild>
      <Link to={`/admin/ordem-servico/${orderId}/imprimir`}>
        <Printer className="w-4 h-4 mr-2" />
        Imprimir OS
      </Link>
    </Button>
  )
}
