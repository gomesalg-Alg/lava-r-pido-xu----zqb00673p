import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCompany, type Company } from '@/services/company'
import { getServiceOrderItems } from '@/services/service-orders'
import { getOrderPayments } from '@/services/order-payments'
import { calculateOrderTotals } from '@/lib/order-calculations'
import { formatCurrency, formatDateBR } from '@/lib/format'
import pb from '@/lib/pocketbase/client'
import '@/styles/print.css'

interface VendaItem {
  name?: string
  quantity?: number
  unit_price?: number
  total_price?: number
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<any>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      try {
        const rec = await pb.collection('accounts_receivable').getOne(id, {
          expand: 'customer_id,order_id,venda_avulsa_id',
        })
        const comp = await getCompany()
        setRecord(rec)
        setCompany(comp)
        if (rec.order_id) {
          const [items, pays] = await Promise.all([
            getServiceOrderItems(rec.order_id),
            getOrderPayments(rec.order_id),
          ])
          setOrderItems(items)
          setPayments(pays)
        }
      } catch (err) {
        console.error('Failed to load receipt:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  useEffect(() => {
    if (!loading && record) {
      const timer = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timer)
    }
  }, [loading, record])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Carregando...
      </div>
    )
  }
  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Registro não encontrado
      </div>
    )
  }

  const companyName = company?.trading_name || company?.name || 'Lava Rápido XUÁ'
  const logoUrl = company?.logo
    ? pb.files.getURL({ id: company.id, collectionName: 'company' } as never, company.logo)
    : null
  const vendaItems: VendaItem[] = record.expand?.venda_avulsa_id?.items || []
  const changeAmount = record.expand?.venda_avulsa_id?.change_amount || 0
  const serviceItems = orderItems.filter((i) => i.service_id)
  const productItems = orderItems.filter((i) => i.product_id)
  const totals = orderItems.length > 0 ? calculateOrderTotals(orderItems) : null
  const totalPaid = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
  const currentYear = new Date().getFullYear()
  const paymentMethodLabel = record.payment_method || record.expand?.venda_avulsa_id?.payment_method

  const renderItemsTable = (title: string, items: any[], nameField: string) => {
    if (items.length === 0) return null
    return (
      <div className="mt-6">
        <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b-2 border-gray-300 pb-1">
          {title}
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-blue-800 text-white">
              <th className="text-left py-2 px-3 uppercase text-xs">Item</th>
              <th className="text-center py-2 px-3 uppercase text-xs">Qtd</th>
              <th className="text-right py-2 px-3 uppercase text-xs">Valor Unit.</th>
              <th className="text-right py-2 px-3 uppercase text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="border-b border-gray-200 even:bg-slate-50">
                <td className="py-2 px-3">{item.name || item.expand?.[nameField]?.name || '--'}</td>
                <td className="text-center py-2 px-3">{item.quantity || 1}</td>
                <td className="text-right py-2 px-3">{formatCurrency(item.unit_price || 0)}</td>
                <td className="text-right py-2 px-3 font-semibold text-gray-900">
                  {formatCurrency(
                    item.total_price || (item.quantity || 1) * (item.unit_price || 0),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 print:min-h-0">
      <div className="no-print flex items-center gap-4 p-4 bg-white border-b sticky top-0 z-10">
        <Button variant="outline" asChild>
          <Link to="/admin/contas-receber">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div className="print-container max-w-[800px] mx-auto bg-white p-8 my-4 shadow-lg print:shadow-none print:my-0 print:max-w-none">
        <h1 className="text-3xl font-bold text-center py-2 mb-4 border-b-2 border-gray-800">
          RECIBO
        </h1>
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
          <div className="flex items-start gap-4">
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 object-contain" />}
            <div>
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
          </div>
          <div className="text-right">
            {record.expand?.order_id && (
              <p className="text-sm">
                OS Nº: <strong>{record.expand.order_id.ticket_number}</strong>
              </p>
            )}
            {record.created && <p className="text-sm">Emissão: {formatDateBR(record.created)}</p>}
            <p className="text-sm">
              Status: <strong>{record.status || '--'}</strong>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Cliente</h3>
          <p className="text-sm font-medium">{record.expand?.customer_id?.name || '--'}</p>
          {record.expand?.customer_id?.phone && (
            <p className="text-sm">Tel: {record.expand.customer_id.phone}</p>
          )}
          {record.expand?.customer_id?.cpf && (
            <p className="text-sm">CPF: {record.expand.customer_id.cpf}</p>
          )}
        </div>

        {vendaItems.length > 0 && renderItemsTable('Itens', vendaItems, '')}
        {serviceItems.length > 0 && renderItemsTable('Serviços', serviceItems, 'service_id')}
        {productItems.length > 0 && renderItemsTable('Produtos', productItems, 'product_id')}

        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-1">
            {totals && (
              <>
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
              </>
            )}
            <div className="flex justify-between text-base font-bold border-t-2 border-gray-800 pt-1">
              <span>Total:</span>
              <span>{formatCurrency(record.amount)}</span>
            </div>
          </div>
        </div>

        {(payments.length > 0 || paymentMethodLabel || changeAmount > 0) && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Forma de Pagamento
            </h3>
            <div className="space-y-1">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <div key={p.id} className="space-y-0.5">
                    <div className="flex justify-between text-sm">
                      <span>
                        {p.method}
                        {p.method === 'Cartão de Crédito' && p.installments > 1
                          ? ` (${p.installments}x)`
                          : ''}
                      </span>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                    </div>
                    {(p.method === 'Cartão de Crédito' || p.method === 'Cartão de Débito') &&
                      p.card_flag && (
                        <div className="flex justify-between text-sm text-slate-500 pl-2">
                          <span>Bandeira: {p.card_flag}</span>
                        </div>
                      )}
                  </div>
                ))
              ) : paymentMethodLabel ? (
                <div className="flex justify-between text-sm">
                  <span>{paymentMethodLabel}</span>
                  <span className="font-medium">{formatCurrency(record.amount)}</span>
                </div>
              ) : null}
              {payments.length > 0 && (
                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                  <span>Total Pago:</span>
                  <span>{formatCurrency(totalPaid)}</span>
                </div>
              )}
              {changeAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Troco:</span>
                  <span className="font-medium">{formatCurrency(changeAmount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {record.status === 'Recebido' && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-bold text-green-700">✓ PAGO</p>
            {record.received_at && (
              <p className="text-sm text-green-600">
                Recebido em: {formatDateBR(record.received_at)}
              </p>
            )}
          </div>
        )}

        {record.description && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Descrição</h3>
            <p className="text-sm">{record.description}</p>
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
            Copyright &copy; {currentYear} {companyName} · www.lavarapidoxua.com.br
          </p>
        </div>
      </div>
    </div>
  )
}
