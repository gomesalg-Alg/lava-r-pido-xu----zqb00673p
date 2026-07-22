import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PosProductGrid } from '@/components/admin/PosProductGrid'
import { PosCheckout, type CartItem } from '@/components/admin/PosCheckout'
import {
  searchServiceOrdersByPlacaOrTicket,
  getServiceOrderItems,
  createServiceOrderItem,
  updateServiceOrder,
  type ServiceOrder,
  type ServiceOrderItem,
} from '@/services/service-orders'
import type { Product } from '@/services/products'
import { Search, ScanLine, Car, User, X } from 'lucide-react'
import { toast } from 'sonner'

export default function PosPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [existingItems, setExistingItems] = useState<ServiceOrderItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [finalizing, setFinalizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = async (value: string) => {
    setSearch(value)
    if (value.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    setLoading(true)
    try {
      const data = await searchServiceOrdersByPlacaOrTicket(value)
      setResults(data)
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const selectOrder = async (order: ServiceOrder) => {
    setSelectedOrder(order)
    setSearch('')
    setResults([])
    setShowResults(false)
    setCart([])
    try {
      const items = await getServiceOrderItems(order.id)
      setExistingItems(items)
    } catch {
      setExistingItems([])
    }
  }

  const clearOrder = () => {
    setSelectedOrder(null)
    setExistingItems([])
    setCart([])
  }

  const existingCartItems: CartItem[] = existingItems.map((i) => ({
    id: i.id,
    service_id: i.service_id,
    product_id: i.product_id,
    name: i.expand?.service_id?.name || i.expand?.product_id?.name || 'Item',
    quantity: i.quantity || 1,
    unit_price: i.unit_price || 0,
    isExisting: true,
  }))

  const allItems = [...existingCartItems, ...cart]

  const handleAddProduct = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: product.price,
          isExisting: false,
        },
      ]
    })
  }

  const handleRemoveItem = (index: number) => {
    if (index < existingCartItems.length) return
    const cartIndex = index - existingCartItems.length
    setCart((prev) => prev.filter((_, i) => i !== cartIndex))
  }

  const handleFinalize = async (data: {
    payment_method: string
    total_discount: number
    total_surcharge: number
    amount_paid: number
  }) => {
    if (!selectedOrder) return
    setFinalizing(true)
    try {
      for (const item of cart) {
        await createServiceOrderItem({
          order_id: selectedOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        })
      }
      await updateServiceOrder(selectedOrder.id, {
        status: 'Finalizado',
        payment_method: data.payment_method,
        total_discount: data.total_discount,
        total_surcharge: data.total_surcharge,
        amount_paid: data.amount_paid,
      })
      toast.success('Venda finalizada com sucesso!')
      navigate('/admin/ordem-servico')
    } catch {
      toast.error('Erro ao finalizar venda')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Frente de Caixa</h1>

      <div className="relative max-w-2xl mb-6" ref={containerRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar por placa ou número do ticket..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={() => handleSearch(search)}
        >
          <ScanLine className="w-5 h-5" />
        </Button>
        {showResults && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-md border shadow-lg max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-slate-400">Buscando...</div>
            ) : results.length === 0 ? (
              <div className="p-3 text-sm text-slate-400">Nenhuma ordem encontrada.</div>
            ) : (
              results.map((o) => (
                <button
                  key={o.id}
                  onClick={() => selectOrder(o)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 text-sm">
                      #{String(o.ticket_number).padStart(4, '0')}
                    </span>
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {o.expand?.customer_id?.name || '-'}
                    </span>
                  </div>
                  {o.expand?.vehicle_id && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      {o.expand.vehicle_id.brand} {o.expand.vehicle_id.model}
                      {o.expand.vehicle_id.placa && ` — ${o.expand.vehicle_id.placa}`}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {!selectedOrder ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ScanLine className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">
              Busque por placa ou número do ticket para iniciar uma venda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  Ordem #{String(selectedOrder.ticket_number).padStart(4, '0')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={clearOrder}>
                  <X className="w-4 h-4 mr-1" /> Nova Busca
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Cliente
                    </p>
                    <p className="font-medium">{selectedOrder.expand?.customer_id?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> Veículo
                    </p>
                    <p className="font-medium">
                      {selectedOrder.expand?.vehicle_id
                        ? `${selectedOrder.expand.vehicle_id.brand} ${selectedOrder.expand.vehicle_id.model}`
                        : '-'}
                      {selectedOrder.expand?.vehicle_id?.placa &&
                        ` — ${selectedOrder.expand.vehicle_id.placa}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <PosProductGrid onAdd={handleAddProduct} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-lg">Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <PosCheckout
                  items={allItems}
                  onRemove={handleRemoveItem}
                  onFinalize={handleFinalize}
                  finalizing={finalizing}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
