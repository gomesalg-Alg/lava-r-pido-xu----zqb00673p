import { useEffect, useState } from 'react'
import { Search, QrCode, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PosOrderView } from '@/components/admin/PosOrderView'
import { VendaAvulsaForm } from '@/components/admin/VendaAvulsaForm'
import { searchServiceOrdersByPlacaOrTicket, type ServiceOrder } from '@/services/service-orders'
import { toast } from 'sonner'

export default function PosPage() {
  const [mode, setMode] = useState<'os' | 'avulsa'>('os')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ServiceOrder[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        setSearchResults(await searchServiceOrdersByPlacaOrTicket(searchQuery))
      } catch {
        toast.error('Erro ao buscar ordens')
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  if (mode === 'avulsa') {
    return <VendaAvulsaForm onBack={() => setMode('os')} />
  }

  if (selectedOrder) {
    return (
      <PosOrderView
        order={selectedOrder}
        onBack={() => {
          setSelectedOrder(null)
          setSearchQuery('')
          setSearchResults([])
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-800 text-center py-2">Frente de Caixa</h1>

      <div className="flex gap-2 justify-center">
        <Button
          variant={mode === 'os' ? 'default' : 'outline'}
          onClick={() => setMode('os')}
          className="flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> Venda com OS
        </Button>
        <Button
          variant={mode === 'avulsa' ? 'default' : 'outline'}
          onClick={() => setMode('avulsa')}
          className="flex items-center gap-2"
        >
          <Package className="w-4 h-4" /> Venda Avulsa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar por placa ou número da OS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-12"
        />
        <QrCode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      </div>
      {searching && <p className="text-sm text-slate-400">Buscando...</p>}
      {!searching && searchResults.length === 0 && searchQuery.trim() && (
        <p className="text-sm text-slate-400">Nenhuma ordem encontrada.</p>
      )}
      <div className="space-y-2">
        {searchResults.map((order) => (
          <Card
            key={order.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedOrder(order)
              setSearchResults([])
              setSearchQuery('')
            }}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">OS #{order.ticket_number}</p>
                <p className="text-sm text-slate-500">
                  {order.expand?.customer_id?.name} · {order.expand?.vehicle_id?.placa} ·{' '}
                  {order.expand?.vehicle_id?.brand} {order.expand?.vehicle_id?.model}
                </p>
              </div>
              <Badge variant={order.status === 'Em Andamento' ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
