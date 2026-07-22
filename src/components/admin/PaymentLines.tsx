import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/format'
import type { PaymentLine } from '@/services/order-payments'
import type { CardRate } from '@/services/card-rates'
import { getRateForPayment } from '@/services/card-rates'

const PAYMENT_METHODS = [
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Pix',
  'Cortesia',
  'Outros',
] as const
const isCardMethod = (m: string) => m === 'Cartão de Crédito' || m === 'Cartão de Débito'

export function PaymentLines({
  total,
  lines,
  onLinesChange,
  cardRates,
}: {
  total: number
  lines: PaymentLine[]
  onLinesChange: (lines: PaymentLine[]) => void
  cardRates: CardRate[]
}) {
  const activeFlags = cardRates.filter((r) => r.is_active)

  const updateLine = (id: string, patch: Partial<PaymentLine>) =>
    onLinesChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  const removeLine = (id: string) => onLinesChange(lines.filter((l) => l.id !== id))

  const addLine = () =>
    onLinesChange([
      ...lines,
      { id: crypto.randomUUID(), method: '', amount: 0, card_flag: '', installments: 1 },
    ])

  const totalPaid = lines.filter((l) => l.method && l.amount > 0).reduce((s, l) => s + l.amount, 0)
  const remaining = total - totalPaid
  const troco = remaining < 0 ? Math.abs(remaining) : 0

  const getMaxInstallments = (flag: string) =>
    activeFlags.find((r) => r.flag === flag)?.max_installments ?? 4

  return (
    <div className="space-y-3">
      {lines.map((line) => {
        const rate =
          isCardMethod(line.method) && line.card_flag
            ? getRateForPayment(cardRates, line.card_flag, line.method, line.installments)
            : 0
        const fee = line.amount > 0 ? (line.amount * rate) / 100 : 0
        const maxInst = getMaxInstallments(line.card_flag)
        return (
          <div key={line.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-slate-50">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={line.method || undefined}
                onValueChange={(v) => {
                  const patch: Partial<PaymentLine> = { method: v as PaymentLine['method'] }
                  if (!isCardMethod(v)) {
                    patch.card_flag = ''
                    patch.installments = 1
                  }
                  updateLine(line.id, patch)
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor"
                value={line.amount || ''}
                className="w-32"
                onChange={(e) => updateLine(line.id, { amount: parseFloat(e.target.value) || 0 })}
              />
              {isCardMethod(line.method) && (
                <Select
                  value={line.card_flag || undefined}
                  onValueChange={(v) => {
                    const newMax = getMaxInstallments(v)
                    const patch: Partial<PaymentLine> = {
                      card_flag: v as PaymentLine['card_flag'],
                    }
                    if (line.installments > newMax) {
                      patch.installments = newMax
                    }
                    updateLine(line.id, patch)
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Bandeira" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeFlags.map((r) => (
                      <SelectItem key={r.flag} value={r.flag}>
                        {r.flag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {line.method === 'Cartão de Crédito' && (
                <Select
                  value={String(line.installments)}
                  onValueChange={(v) => updateLine(line.id, { installments: parseInt(v) })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxInst }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLine(line.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            {isCardMethod(line.method) && line.card_flag && line.amount > 0 && (
              <p className="text-xs text-slate-500">
                Taxa: {rate.toFixed(2)}% · Desconto da bandeira: {formatCurrency(fee)}
              </p>
            )}
          </div>
        )
      })}
      <Button variant="outline" size="sm" onClick={addLine}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar Pagamento
      </Button>
      <div className="space-y-1 pt-3 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Pago:</span>
          <span className="font-medium">{formatCurrency(totalPaid)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Saldo Restante:</span>
          <span
            className={remaining > 0.01 ? 'font-medium text-red-600' : 'font-medium text-green-600'}
          >
            {formatCurrency(Math.max(remaining, 0))}
          </span>
        </div>
        {troco > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Troco:</span>
            <span className="font-medium text-blue-600">{formatCurrency(troco)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
