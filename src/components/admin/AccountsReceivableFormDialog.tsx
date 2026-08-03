import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import { CurrencyInput } from '@/components/admin/CurrencyInput'
import { getCustomers } from '@/services/customers'
import { getActiveBankAccounts, type BankAccount } from '@/services/bank-accounts'
import { getServiceOrders } from '@/services/service-orders'
import { getVendasAvulsas } from '@/services/vendas-avulsas'
import {
  createAccountsReceivable,
  updateAccountsReceivable,
  type AccountsReceivable,
} from '@/services/accounts-receivable'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const STATUS_OPTIONS = ['Pendente', 'Recebido', 'Cancelado']
const NONE = { value: '', label: 'Nenhum' }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: AccountsReceivable | null
  onSuccess: () => void
}

export function AccountsReceivableFormDialog({ open, onOpenChange, record, onSuccess }: Props) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [orders, setOrders] = useState<
    { id: string; ticket_number: number; expand?: { customer_id?: { name: string } } }[]
  >([])
  const [vendas, setVendas] = useState<
    { id: string; total_amount: number; expand?: { customer_id?: { name: string } } }[]
  >([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({
    customer_id: '',
    order_id: '',
    venda_avulsa_id: '',
    bank_account_id: '',
    description: '',
    amount: 0,
    due_date: '',
    status: 'Pendente',
    payment_method: '',
    received_at: '',
    discount_amount: 0,
    surcharge_amount: 0,
  })

  useEffect(() => {
    if (!open) return
    Promise.all([getCustomers(), getServiceOrders(), getVendasAvulsas(), getActiveBankAccounts()])
      .then(([c, o, v, b]) => {
        setCustomers(c)
        setOrders(o)
        setVendas(v)
        setBankAccounts(b)
      })
      .catch(() => toast.error('Erro ao carregar dados'))
  }, [open])

  useEffect(() => {
    if (record) {
      setForm({
        customer_id: record.customer_id || '',
        order_id: record.order_id || '',
        venda_avulsa_id: record.venda_avulsa_id || '',
        bank_account_id: record.bank_account_id || '',
        description: record.description || '',
        amount: record.amount || 0,
        due_date: record.due_date ? record.due_date.split('T')[0] : '',
        status: record.status || 'Pendente',
        payment_method: record.payment_method || '',
        received_at: record.received_at ? record.received_at.split('T')[0] : '',
        discount_amount: record.discount_amount || 0,
        surcharge_amount: record.surcharge_amount || 0,
      })
    } else {
      setForm({
        customer_id: '',
        order_id: '',
        venda_avulsa_id: '',
        bank_account_id: '',
        description: '',
        amount: 0,
        due_date: '',
        status: 'Pendente',
        payment_method: '',
        received_at: '',
        discount_amount: 0,
        surcharge_amount: 0,
      })
    }
    setErrors({})
  }, [record, open])

  const set = (k: keyof typeof form, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setSaving(true)
    setErrors({})
    const data: Record<string, unknown> = {
      customer_id: form.customer_id || null,
      order_id: form.order_id || null,
      venda_avulsa_id: form.venda_avulsa_id || null,
      bank_account_id: form.bank_account_id || null,
      description: form.description,
      amount: form.amount,
      due_date: form.due_date,
      status: form.status,
      payment_method: form.payment_method,
      received_at: form.status === 'Recebido' && form.received_at ? form.received_at : null,
      discount_amount: form.discount_amount || null,
      surcharge_amount: form.surcharge_amount || null,
    }
    try {
      if (record) {
        await updateAccountsReceivable(record.id, data)
        toast.success('Conta atualizada!')
      } else {
        await createAccountsReceivable(data)
        toast.success('Conta criada!')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar conta')
    } finally {
      setSaving(false)
    }
  }

  const customerOpts = customers.map((c) => ({ value: c.id, label: c.name }))
  const orderOpts = [
    NONE,
    ...orders.map((o) => ({
      value: o.id,
      label: `#${String(o.ticket_number).padStart(4, '0')} - ${o.expand?.customer_id?.name || 'Sem cliente'}`,
    })),
  ]
  const vendaOpts = [
    NONE,
    ...vendas.map((v) => ({
      value: v.id,
      label: `Venda - ${v.expand?.customer_id?.name || 'Avulso'} - R$ ${(v.total_amount || 0).toFixed(2)}`,
    })),
  ]
  const bankOpts = [
    NONE,
    ...bankAccounts.map((b) => ({ value: b.id, label: b.trading_name || b.name })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{record ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Cliente *</Label>
              <SearchableSelect
                options={customerOpts}
                value={form.customer_id}
                onChange={(v) => set('customer_id', v)}
                placeholder="Selecionar..."
                searchPlaceholder="Buscar..."
              />
              {errors.customer_id && <p className="text-sm text-red-500">{errors.customer_id}</p>}
            </div>
            <div className="space-y-1">
              <Label>Banco</Label>
              <SearchableSelect
                options={bankOpts}
                value={form.bank_account_id}
                onChange={(v) => set('bank_account_id', v)}
                placeholder="Selecionar..."
                searchPlaceholder="Buscar..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ordem de Serviço</Label>
              <SearchableSelect
                options={orderOpts}
                value={form.order_id}
                onChange={(v) => set('order_id', v)}
                placeholder="Selecionar..."
                searchPlaceholder="Buscar..."
              />
            </div>
            <div className="space-y-1">
              <Label>Venda Avulsa</Label>
              <SearchableSelect
                options={vendaOpts}
                value={form.venda_avulsa_id}
                onChange={(v) => set('venda_avulsa_id', v)}
                placeholder="Selecionar..."
                searchPlaceholder="Buscar..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descrição..."
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Valor (R$) *</Label>
              <CurrencyInput value={form.amount} onChange={(v) => set('amount', v)} />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            </div>
            <div className="space-y-1">
              <Label>Desconto (R$)</Label>
              <CurrencyInput
                value={form.discount_amount}
                onChange={(v) => set('discount_amount', v)}
              />
            </div>
            <div className="space-y-1">
              <Label>Acréscimo (R$)</Label>
              <CurrencyInput
                value={form.surcharge_amount}
                onChange={(v) => set('surcharge_amount', v)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Vencimento *</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
              />
              {errors.due_date && <p className="text-sm text-red-500">{errors.due_date}</p>}
            </div>
            <div className="space-y-1">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Forma de Pagamento</Label>
              <Input
                value={form.payment_method}
                onChange={(e) => set('payment_method', e.target.value)}
                placeholder="Ex: Pix..."
              />
            </div>
          </div>
          {form.status === 'Recebido' && (
            <div className="space-y-1">
              <Label>Data de Recebimento</Label>
              <Input
                type="date"
                value={form.received_at}
                onChange={(e) => set('received_at', e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {record ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
