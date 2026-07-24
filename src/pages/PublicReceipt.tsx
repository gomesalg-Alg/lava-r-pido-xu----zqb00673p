import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPublicReceipt, type PublicReceiptData } from '@/services/receipts'
import { formatCurrency, formatDateBR } from '@/lib/format'
import { MetaTags } from '@/components/MetaTags'
import '@/styles/print.css'

export default function PublicReceipt() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<PublicReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    getPublicReceipt(id)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Carregando...
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Recibo não encontrado.
      </div>
    )
  }

  const companyName = data.company?.trading_name || data.company?.name || 'Lava Rápido XUÁ'
  const currentYear = new Date().getFullYear()
  const logoUrl = data.company?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company/${data.company.id}/${data.company.logo}`
    : null

  const allItems = data.items.length > 0 ? data.items : data.venda_avulsa?.items || []
  const subtotal = allItems.reduce((s, i) => s + (i.unit_price || 0) * (i.quantity || 1), 0)
  const itemDiscount = allItems.reduce((s, i) => s + (i.discount_amount || 0), 0)
  const itemSurcharge = allItems.reduce((s, i) => s + (i.surcharge_amount || 0), 0)
  const totalDiscount = itemDiscount + (data.order?.total_discount || 0)
  const totalSurcharge = itemSurcharge + (data.order?.total_surcharge || 0)
  const totalPaid = data.payments.reduce((s, p) => s + (p.amount || 0), 0)
  const troco =
    data.venda_avulsa?.change_amount || (totalPaid > data.amount ? totalPaid - data.amount : 0)
  const paymentMethodLabel = data.payment_method || data.venda_avulsa?.payment_method || ''

  return (
    <div className="min-h-screen bg-slate-100">
      <MetaTags
        title={`Recibo - ${companyName}`}
        description="Seu recibo de serviço"
        image={logoUrl || undefined}
        url={window.location.href}
      />
      <div className="no-print flex items-center gap-4 p-4 bg-white border-b sticky top-0 z-10">
        <Button variant="outline" onClick={() => window.print()}>
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
          <div className="mt-4">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Cliente</h3>
            <p className="text-sm font-medium">{data.customer.name}</p>
            {data.customer.phone && <p className="text-sm">Tel: {data.customer.phone}</p>}
            {data.customer.cpf && <p className="text-sm">CPF: {data.customer.cpf}</p>}
          </div>
        )}

        {allItems.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b-2 border-gray-300 pb-1">
              Itens
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
                {allItems.map((item, idx) => (
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
          </div>
        )}

        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto:</span>
                <span>- {formatCurrency(totalDiscount)}</span>
              </div>
            )}
            {totalSurcharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Acréscimo:</span>
                <span>+ {formatCurrency(totalSurcharge)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t-2 border-gray-800 pt-1">
              <span>Total:</span>
              <span>{formatCurrency(data.amount)}</span>
            </div>
          </div>
        </div>

        {(data.payments.length > 0 || paymentMethodLabel) && (
          <div className="mt-6">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Forma de Pagamento
            </h3>
            <div className="space-y-1">
              {data.payments.length > 0 ? (
                data.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {p.method}
                      {p.card_flag ? ` · ${p.card_flag}` : ''}
                      {p.method === 'Cartão de Crédito' && p.installments > 1
                        ? ` (${p.installments}x)`
                        : ''}
                    </span>
                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-sm">
                  <span>{paymentMethodLabel}</span>
                  <span className="font-medium">{formatCurrency(data.amount)}</span>
                </div>
              )}
              {troco > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Troco:</span>
                  <span className="font-medium">{formatCurrency(troco)}</span>
                </div>
              )}
              {data.payments.length > 0 && (
                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                  <span>Total Pago:</span>
                  <span>{formatCurrency(totalPaid)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {data.status === 'Recebido' && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-bold text-green-700">✓ PAGO</p>
            {data.received_at && (
              <p className="text-sm text-green-600">
                Recebido em: {formatDateBR(data.received_at)}
              </p>
            )}
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
