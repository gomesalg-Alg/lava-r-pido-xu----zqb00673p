import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getServiceOrder,
  getServiceOrderItems,
  type ServiceOrder,
  type ServiceOrderItem,
} from '@/services/service-orders'
import { getCompany, type Company } from '@/services/company'
import { getOrderPayments, type OrderPayment } from '@/services/order-payments'
import { calculateOrderTotals } from '@/lib/order-calculations'
import { formatCurrency, formatDuration, toDateInput } from '@/lib/format'
import pb from '@/lib/pocketbase/client'
import '@/styles/print.css'

export default function PrintServiceOrderPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [items, setItems] = useState<ServiceOrderItem[]>([])
  const [payments, setPayments] = useState<OrderPayment[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      try {
        const [ord, itms, comp, pays] = await Promise.all([
          getServiceOrder(id),
          getServiceOrderItems(id),
          getCompany(),
          getOrderPayments(id),
        ])
        setOrder(ord)
        setItems(itms)
        setCompany(comp)
        setPayments(pays)
      } catch (err) {
        console.error('Failed to load print data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  useEffect(() => {
    if (!loading && order) {
      const timer = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timer)
    }
  }, [loading, order])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Carregando...
      </div>
    )
  }
  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Ordem não encontrada
      </div>
    )
  }

  const serviceItems = items.filter((i) => i.service_id)
  const productItems = items.filter((i) => i.product_id)
  const totals = calculateOrderTotals(items)
  const companyName = company?.trading_name || company?.name || 'Lava Rápido XUÁ'
  const currentYear = new Date().getFullYear()
  const logoUrl = company?.logo
    ? pb.files.getURL({ id: company.id, collectionName: 'company' } as never, company.logo)
    : null
  const photoUrl = order.photo
    ? pb.files.getURL({ id: order.id, collectionName: 'service_orders' } as never, order.photo)
    : null
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print flex items-center gap-4 p-4 bg-white border-b sticky top-0 z-10">
        <Button variant="outline" asChild>
          <Link to="/admin/ordem-servico">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div className="print-container max-w-[800px] mx-auto bg-white p-8 my-4 shadow-lg print:shadow-none print:my-0 print:max-w-none">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
          <div>
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mb-2 object-contain" />}
            <h1 className="text-xl font-bold">{companyName}</h1>
            {company?.phone && <p className="text-sm text-gray-600">Tel: {company.phone}</p>}
            {company?.address && (
              <p className="text-sm text-gray-600">
                {company.address}
                {company?.number ? `, ${company.number}` : ''}
              </p>
            )}
            {company?.city && (
              <p className="text-sm text-gray-600">
                {company.city} - {company.state}
              </p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold">Ordem de Serviço</h2>
            <p className="text-sm">
              Nº: <strong>{order.ticket_number}</strong>
            </p>
            {order.prisma_number && <p className="text-sm">Prisma: {order.prisma_number}</p>}
            {order.emission_date && (
              <p className="text-sm">Emissão: {toDateInput(order.emission_date)}</p>
            )}
            <p className="text-sm">
              Status: <strong>{order.status || '--'}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Cliente</h3>
            <p className="text-sm font-medium">{order.expand?.customer_id?.name || '--'}</p>
            {order.expand?.customer_id?.phone && (
              <p className="text-sm">Tel: {order.expand.customer_id.phone}</p>
            )}
            {order.expand?.customer_id?.cpf && (
              <p className="text-sm">CPF: {order.expand.customer_id.cpf}</p>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Veículo</h3>
            <p className="text-sm font-medium">
              {order.expand?.vehicle_id?.brand} {order.expand?.vehicle_id?.model}
            </p>
            {order.expand?.vehicle_id?.placa && (
              <p className="text-sm">Placa: {order.expand.vehicle_id.placa}</p>
            )}
            {order.expand?.vehicle_id?.type && (
              <p className="text-sm">Tipo: {order.expand.vehicle_id.type}</p>
            )}
          </div>
        </div>

        {serviceItems.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b-2 border-gray-300 pb-1">
              Grupo Serviços
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-blue-800 text-white">
                  <th className="text-left py-2 px-3 uppercase text-xs">Serviço</th>
                  <th className="text-left py-2 px-3 uppercase text-xs">Operador</th>
                  <th className="text-center py-2 px-3 uppercase text-xs">Qtd</th>
                  <th className="text-right py-2 px-3 uppercase text-xs">Valor Unit.</th>
                  <th className="text-right py-2 px-3 uppercase text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {serviceItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50">
                    <td className="py-2 px-3">{item.expand?.service_id?.name || '--'}</td>
                    <td className="py-2 px-3">{item.expand?.operator_id?.name || '--'}</td>
                    <td className="text-center py-2 px-3">{item.quantity}</td>
                    <td className="text-right py-2 px-3">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right py-2 px-3 font-semibold text-gray-900">
                      {formatCurrency((item.quantity || 1) * (item.unit_price || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {productItems.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b-2 border-gray-300 pb-1">
              Grupo Produtos
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-blue-800 text-white">
                  <th className="text-left py-2 px-3 uppercase text-xs">Produto</th>
                  <th className="text-center py-2 px-3 uppercase text-xs">Quantidade</th>
                  <th className="text-right py-2 px-3 uppercase text-xs">Valor Unitário</th>
                  <th className="text-right py-2 px-3 uppercase text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {productItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50">
                    <td className="py-2 px-3">{item.expand?.product_id?.name || '--'}</td>
                    <td className="text-center py-2 px-3">{item.quantity}</td>
                    <td className="text-right py-2 px-3">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right py-2 px-3 font-semibold text-gray-900">
                      {formatCurrency((item.quantity || 1) * (item.unit_price || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length === 0 && (
          <div className="mt-8 text-center py-4 text-gray-400 text-sm">
            Nenhum serviço ou produto registrado
          </div>
        )}

        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto:</span>
                <span>- {formatCurrency(totals.totalDiscount)}</span>
              </div>
            )}
            {totals.totalSurcharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Acréscimo:</span>
                <span>+ {formatCurrency(totals.totalSurcharge)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t-2 border-gray-800 pt-1">
              <span>Total:</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Forma de Pagamento
            </h3>
            <div className="space-y-1">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>
                    {p.method}
                    {p.card_flag && ` · ${p.card_flag}`}
                    {p.method === 'Cartão de Crédito' && p.installments > 1
                      ? ` (${p.installments}x)`
                      : ''}
                  </span>
                  <span className="font-medium">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                <span>Total Pago:</span>
                <span>{formatCurrency(totalPaid)}</span>
              </div>
            </div>
          </div>
        )}

        {(order.entry_at || order.exit_at) && (
          <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
            {order.entry_at && (
              <div>
                <strong>Entrada:</strong> {toDateInput(order.entry_at)}
              </div>
            )}
            {order.exit_at && (
              <div>
                <strong>Saída:</strong> {toDateInput(order.exit_at)}
              </div>
            )}
          </div>
        )}
        {order.entry_at && order.exit_at && (
          <p className="text-sm text-gray-500 mt-1">
            Duração: {formatDuration(order.entry_at, order.exit_at)}
          </p>
        )}

        {order.observation && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Observações</h3>
            <p className="text-sm">{order.observation}</p>
          </div>
        )}

        {photoUrl && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Foto</h3>
            <img src={photoUrl} alt="Foto da OS" className="max-h-48 rounded" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-1 text-xs text-gray-500">Cliente</div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-1 text-xs text-gray-500">Responsável</div>
          </div>
        </div>

        <div className="text-center mt-8 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Copyright &copy; {currentYear} {companyName} - Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
