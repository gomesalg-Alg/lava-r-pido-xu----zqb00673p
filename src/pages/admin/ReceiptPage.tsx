import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { formatCurrency } from '@/lib/format'
import '@/styles/print.css'

type ReceiptData = {
  company: {
    name: string
    trading_name: string
    cnpj: string
    phone: string
    address: string
    number: string
    city: string
    state: string
  } | null
  customer: { name: string; phone: string; cpf: string } | null
  type: 'os' | 'venda_avulsa'
  services: { description: string; quantity: number; unit_price: number; total: number }[]
  products: { description: string; quantity: number; unit_price: number; total: number }[]
  payments: { method: string; amount: number; card_flag: string; installments: number }[]
  total_paid: number
  change_amount: number
  grand_total: number
  description: string
  created: string
  status: string
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const result = await pb.send(`/backend/v1/recibo/${id}`, { method: 'GET' })
        setData(result as ReceiptData)
      } catch (err) {
        console.error('Failed to load receipt:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!loading && data) {
      const timer = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timer)
    }
  }, [loading, data])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Carregando...
      </div>
    )
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Recibo não encontrado
      </div>
    )
  }

  const companyName = data.company?.trading_name || data.company?.name || 'Lava Rápido XUÁ'
  const createdDate = data.created ? new Date(data.created).toLocaleString('pt-BR') : '--'

  const formatPayment = (p: ReceiptData['payments'][0]) => {
    let str = p.method
    if (p.card_flag) str += ` – ${p.card_flag}`
    if (p.method === 'Cartão de Crédito' && p.installments > 1) str += ` – ${p.installments}x`
    return str
  }

  return (
    <div className="min-h-screen bg-gray-100">
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

      <div className="print-container max-w-[600px] mx-auto bg-white p-8 my-4 shadow-lg print:shadow-none print:my-0 print:max-w-none">
        <div className="text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-xl font-bold">{companyName}</h1>
          {data.company?.phone && (
            <p className="text-sm text-gray-600">Tel: {data.company.phone}</p>
          )}
          {data.company?.address && (
            <p className="text-sm text-gray-600">
              {data.company.address}
              {data.company.number ? `, ${data.company.number}` : ''}
            </p>
          )}
          {data.company?.city && (
            <p className="text-sm text-gray-600">
              {data.company.city} - {data.company.state}
            </p>
          )}
          {data.company?.cnpj && <p className="text-sm text-gray-600">CNPJ: {data.company.cnpj}</p>}
        </div>

        <div className="text-center my-4">
          <h2 className="text-lg font-bold">RECIBO</h2>
          <p className="text-sm text-gray-500">{data.description}</p>
        </div>

        {data.customer && (
          <div className="mb-4">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-1">Cliente</h3>
            <p className="text-sm font-medium">{data.customer.name}</p>
            {data.customer.phone && <p className="text-sm">Tel: {data.customer.phone}</p>}
            {data.customer.cpf && <p className="text-sm">CPF: {data.customer.cpf}</p>}
          </div>
        )}

        {data.services.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b border-gray-300 pb-1">
              Serviços
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1">Descrição</th>
                  <th className="text-center py-1">Qtd</th>
                  <th className="text-right py-1">Valor Unit.</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.services.map((s, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{s.description}</td>
                    <td className="text-center py-1">{s.quantity}</td>
                    <td className="text-right py-1">{formatCurrency(s.unit_price)}</td>
                    <td className="text-right py-1 font-medium">{formatCurrency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.products.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b border-gray-300 pb-1">
              Produtos
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1">Descrição</th>
                  <th className="text-center py-1">Qtd</th>
                  <th className="text-right py-1">Valor Unit.</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{p.description}</td>
                    <td className="text-center py-1">{p.quantity}</td>
                    <td className="text-right py-1">{formatCurrency(p.unit_price)}</td>
                    <td className="text-right py-1 font-medium">{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mb-4">
          <div className="w-56">
            <div className="flex justify-between text-sm font-bold border-t-2 border-gray-800 pt-1">
              <span>Total Geral:</span>
              <span>{formatCurrency(data.grand_total)}</span>
            </div>
          </div>
        </div>

        {data.payments.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b border-gray-300 pb-1">
              Forma de Pagamento
            </h3>
            <div className="space-y-1">
              {data.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{formatPayment(p)}</span>
                  <span className="font-medium">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t pt-1">
                <span>Total Recebido:</span>
                <span>{formatCurrency(data.total_paid)}</span>
              </div>
              {data.change_amount > 0 && (
                <div className="flex justify-between text-sm font-bold text-green-700">
                  <span>Troco:</span>
                  <span>{formatCurrency(data.change_amount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-8 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">Data/Hora: {createdDate}</p>
          <p className="text-xs text-gray-400 mt-2">
            Copyright © {new Date().getFullYear()} {companyName} - Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
