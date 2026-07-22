import { useState, useEffect } from 'react'
import { CreditCard, Banknote, Smartphone, Gift, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getOrderPayments, type OrderPayment } from '@/services/order-payments'
import { formatCurrency } from '@/lib/format'

const METHOD_ICONS: Record<string, typeof Banknote> = {
  Dinheiro: Banknote,
  'Cartão de Crédito': CreditCard,
  'Cartão de Débito': CreditCard,
  Pix: Smartphone,
  Cortesia: Gift,
  Outros: Wallet,
}

export function PaymentSummary({ orderId }: { orderId: string }) {
  const [payments, setPayments] = useState<OrderPayment[]>([])

  useEffect(() => {
    getOrderPayments(orderId)
      .then(setPayments)
      .catch(() => {})
  }, [orderId])

  if (payments.length === 0) return null

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase text-slate-500">Formas de Pagamento</p>
      <div className="flex flex-wrap gap-2">
        {payments.map((p) => {
          const Icon = METHOD_ICONS[p.method] || Wallet
          return (
            <Badge key={p.id} variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm">
              <Icon className="w-3.5 h-3.5" />
              <span className="font-medium">{p.method}</span>
              <span className="text-slate-400">·</span>
              <span>{formatCurrency(p.amount)}</span>
              {p.card_flag && (
                <span className="text-xs text-slate-500">
                  {p.card_flag}
                  {p.method === 'Cartão de Crédito' && p.installments > 1
                    ? ` ${p.installments}x`
                    : ''}
                </span>
              )}
            </Badge>
          )
        })}
      </div>
      <div className="flex justify-between items-center text-sm border-t pt-2">
        <span className="font-medium text-slate-600">Total Pago:</span>
        <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
      </div>
    </div>
  )
}
