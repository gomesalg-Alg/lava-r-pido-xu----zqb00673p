import { useState, useEffect, useCallback } from 'react'
import { PosOrderView } from '@/components/admin/PosOrderView'
import { PosVendaAvulsa } from '@/components/admin/PosVendaAvulsa'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'
import { ArrowRight } from 'lucide-react'

export default function PosPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOrders = useCallback(async () => {
    try {
      const all = await getServiceOrders()
      const unpaid = all.filter(
        (o: ServiceOrder) =>
          o.status === 'Em Andamento' || o.status === 'Orçamento' || o.status === 'Finalizado',
      )
      setOrders(unpaid)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useRealtime('service_orders', () => {
    loadOrders()
  })

  if (selectedOrder) {
    return <PosOrderView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 px-4 py-3 text-center rounded-lg">
        <h1 className="text-3xl font-bold text-white">Frente de Caixa</h1>
      </div>
      <Tabs defaultValue="orders">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="avulsa">Venda Avulsa</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          {loading ? (
            <p className="text-center text-slate-400 py-8">Carregando...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Nenhuma ordem pendente.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">OS #{order.ticket_number}</p>
                      <p className="text-sm text-slate-500">
                        {order.expand?.customer_id?.name || 'Sem cliente'} ·{' '}
                        {order.placa || order.expand?.vehicle_id?.placa || ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{order.status}</Badge>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="avulsa" className="mt-4">
          <PosVendaAvulsa />
        </TabsContent>
      </Tabs>
    </div>
  )
}
