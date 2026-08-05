import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPublicReceipt, type PublicReceiptData } from '@/services/receipts'
import { consolidatePayments } from '@/lib/payment-utils'
import { formatCurrency, formatDateBR, formatDateTimeBR } from '@/lib/format'
import { maskCPF, maskPhone } from '@/lib/masks'
import { MetaTags } from '@/components/MetaTags'
import { generateReceiptPdf, formatPaymentLabel } from '@/lib/receipt-pdf'

export default function PublicReceipt() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<PublicReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getPublicReceipt(id)
      .then(setData)
      .catch((err: any) => {
        setError(err?.status === 404 ? 'not_found' : 'error')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Carregando...
      </div>
    )
  }
  if (error === 'not_found') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 gap-2 p-4">
        <p className="text-lg font-semibold">Recibo não encontrado</p>
        <p className="text-sm text-center">
          Este recibo pode ter sido removido ou o link pode estar incorreto. Verifique se o link
          está correto ou entre em contato com o estabelecimento.
        </p>
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 gap-2 p-4">
        <p className="text-lg font-semibold">Erro ao carregar recibo</p>
        <p className="text-sm text-center">
          Não foi possível carregar o recibo no momento. Tente novamente em alguns instantes.
        </p>
      </div>
    )
  }

  const companyName = data.company?.trading_name || data.company?.name || 'Lava Rápido XUÁ'
  const currentYear = new Date().getFullYear()
  const logoUrl = data.company?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company/${data.company.id}/${data.company.logo}`
    : null

  const hasOrderItems = data.items.length > 0
  const serviceItems = hasOrderItems ? data.items.filter((i) => i.type === 'service') : []
  const productItems = hasOrderItems ? data.items.filter((i) => i.type === 'product') : []
  const vendaItems = !hasOrderItems ? data.venda_avulsa?.items || [] : []
  const allItems = [...serviceItems, ...productItems, ...vendaItems]
  const subtotal = allItems.reduce((s, i) => s + (i.unit_price || 0) * (i.quantity || 1), 0)
  const itemDiscount = allItems.reduce((s, i) => s + (i.discount_amount || 0), 0)
  const itemSurcharge = allItems.reduce((s, i) => s + (i.surcharge_amount || 0), 0)
  const totalDiscount = itemDiscount + (data.order?.total_discount || 0)
  const totalSurcharge = itemSurcharge + (data.order?.total_surcharge || 0)

  const paymentMethodLabel = data.payment_method || data.venda_avulsa?.payment_method || ''
  const changeAmount = data.venda_avulsa?.change_amount || 0

  const consolidated = consolidatePayments({
    rawPayments: data.payments,
    orderTotal: data.amount || 0,
    fallbackMethod: paymentMethodLabel,
    changeAmount: changeAmount,
  })

  const renderItemsTable = (title: string, items: any[], groupSubtotal?: number) => {
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
              <tr key={idx} className="border-b border-gray-200 even:bg-slate-50">
                <td className="py-2 px-3">{item.name || '--'}</td>
                <td className="text-center py-2 px-3">{item.quantity || 1}</td>
                <td className="text-right py-2 px-3">{formatCurrency(item.unit_price || 0)}</td>
                <td className="text-right py-2 px-3 font-semibold">
                  {formatCurrency(
                    item.total_price || (item.quantity || 1) * (item.unit_price || 0),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {groupSubtotal !== undefined && (
          <div className="flex justify-end mt-2">
            <div className="flex justify-between w-64 text-sm font-semibold border-t border-gray-300 pt-1">
              <span>Sub-total:</span>
              <span>{formatCurrency(groupSubtotal)}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const handlePrint = () => {
    generateReceiptPdf({
      companyName,
      companyPhone: data.company?.phone,
      companyAddress: data.company?.address,
      companyNumber: data.company?.number,
      companyCity: data.company?.city,
      companyState: data.company?.state,
      logoUrl,
      orderNumber: data.order?.ticket_number ?? null,
      emissionDate: data.created,
      status: data.status,
      customerName: data.customer?.name,
      customerPhone: data.customer?.phone,
      customerCpf: data.customer?.cpf,
      itemGroups: [
        ...(serviceItems.length > 0
          ? [
              {
                title: 'Serviços',
                items: serviceItems.map((i: any) => ({
                  name: i.name || '--',
                  quantity: i.quantity || 1,
                  unit_price: i.unit_price || 0,
                  total_price: i.total_price || 0,
                })),
                subtotal: data.service_subtotal || 0,
              },
            ]
          : []),
        ...(productItems.length > 0
          ? [
              {
                title: 'Produtos',
                items: productItems.map((i: any) => ({
                  name: i.name || '--',
                  quantity: i.quantity || 1,
                  unit_price: i.unit_price || 0,
                  total_price: i.total_price || 0,
                })),
                subtotal: data.product_subtotal || 0,
              },
            ]
          : []),
        ...(vendaItems.length > 0
          ? [
              {
                title: 'Itens',
                items: vendaItems.map((i: any) => ({
                  name: i.name || '--',
                  quantity: i.quantity || 1,
                  unit_price: i.unit_price || 0,
                  total_price: i.total_price || 0,
                })),
                subtotal: vendaItems.reduce(
                  (s: number, i: any) => s + (i.unit_price || 0) * (i.quantity || 1),
                  0,
                ),
              },
            ]
          : []),
      ],
      subtotal,
      discount: totalDiscount,
      surcharge: totalSurcharge,
      total: data.amount,
      payments: consolidated.payments,
      totalPaid: consolidated.totalPaid,
      troco: consolidated.troco,
      description: data.description,
      receivedAt: data.received_at,
      isPaid: data.status === 'Recebido',
    })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <MetaTags
        title={`Recibo - ${companyName}`}
        description="Seu recibo de serviço"
        image={logoUrl || undefined}
        url={window.location.href}
      />
      <div className="no-print flex items-center gap-4 p-4 bg-white border-b sticky top-0 z-10">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>
      <div className="print-container max-w-[800px] mx-auto bg-white p-8 my-4 shadow-lg print:shadow-none print:my-0 print:max-w-none">
        <h1 className="text-3xl font-bold text-center py-2 mb-4 border-b-2 border-gray-800">
          RECIBO
        </h1>
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
          <div>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-20 object-contain mb-3"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div>
              <h2 className="text-xl font-bold">{companyName}</h2>
              {data.company?.phone && (
                <p className="text-sm text-gray-600">Tel: {data.company.phone}</p>
              )}
              {data.company?.address && (
                <p className="text-sm text-gray-600">
                  {data.company.address}
                  {data.company?.number ? `, ${data.company.number}` : ''}
                </p>
              )}
              {data.company?.city && (
                <p className="text-sm text-gray-600">
                  {data.company.city} - {data.company.state}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            {data.order && (
              <p className="text-sm">
                OS Nº: <strong>{data.order.ticket_number}</strong>
              </p>
            )}
            <p className="text-sm">Emissão: {formatDateBR(data.created)}</p>
            <p className="text-sm">
              Status: <strong>{data.status || '--'}</strong>
            </p>
          </div>
        </div>

        {data.customer && (
          <div className="mt-3">
            <p className="text-sm font-medium">
              Cliente: {data.customer.name}
              {data.customer.phone && ` - Tel: ${maskPhone(data.customer.phone)}`}
              {data.customer.cpf && ` - CPF: ${maskCPF(data.customer.cpf)}`}
            </p>
          </div>
        )}

        {data.vehicle && (
          <div className="mt-1">
            <p className="text-sm font-medium">
              Veículo: {data.vehicle.brand} {data.vehicle.model}
              {data.vehicle.year ? ` - ${data.vehicle.year}` : ''}
              {data.vehicle.placa ? ` - Placa: ${data.vehicle.placa.toUpperCase()}` : ''}
            </p>
          </div>
        )}

        {serviceItems.length > 0 &&
          renderItemsTable('Serviços', serviceItems, data.service_subtotal)}
        {productItems.length > 0 &&
          renderItemsTable('Produtos', productItems, data.product_subtotal)}
        {vendaItems.length > 0 && renderItemsTable('Itens', vendaItems)}

        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm font-bold bg-red-50 px-2 py-1 rounded">
                <span className="text-red-700">Desconto:</span>
                <span className="text-red-700">- {formatCurrency(totalDiscount)}</span>
              </div>
            )}
            {totalSurcharge > 0 && (
              <div className="flex justify-between text-sm font-bold bg-green-50 px-2 py-1 rounded">
                <span className="text-green-700">Acréscimo:</span>
                <span className="text-green-700">+ {formatCurrency(totalSurcharge)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t-2 border-gray-800 pt-1">
              <span>Total:</span>
              <span>{formatCurrency(data.amount)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-bold text-sm uppercase text-gray-700 mb-2 border-b border-gray-200 pb-1">
            FORMA DE PAGAMENTO
          </h3>
          <div className="space-y-0">
            {consolidated.payments.map((p, i) => (
              <div
                key={i}
                className={`flex justify-between text-sm px-2 py-1 ${i % 2 === 0 ? 'bg-slate-50' : ''}`}
              >
                <span>{formatPaymentLabel(p)}</span>
                <span className="font-medium">{formatCurrency(p.amount)}</span>
              </div>
            ))}
            {consolidated.troco > 0 && (
              <div className="flex justify-between text-sm px-2 py-1">
                <span>Troco:</span>
                <span className="font-medium text-right">{formatCurrency(consolidated.troco)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
              <span>Total Pago:</span>
              <span>{formatCurrency(consolidated.totalPaid)}</span>
            </div>
          </div>
        </div>

        {(data.status === 'Recebido' || data.status === 'Pago') && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-bold text-green-700">
              ✓ PAGO{data.received_at ? ` em ${formatDateTimeBR(data.received_at)}` : ''}
            </p>
          </div>
        )}

        {data.description && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Descrição</h3>
            <p className="text-sm">{data.description}</p>
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
