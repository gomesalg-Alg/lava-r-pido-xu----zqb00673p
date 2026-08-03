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
import { getSuppliers } from '@/services/suppliers'
import { getActiveBankAccounts, type BankAccount } from '@/services/bank-accounts'
import {
  createAccountsPayable,
  updateAccountsPayable,
  type AccountsPayable,
} from '@/services/accounts-payable'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const STATUS_OPTIONS = ['Pendente', 'Pago', 'Cancelado']
const NONE = { value: '', label: 'Nenhum' }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: AccountsPayable | null
  onSuccess: () => void
}

export function AccountsPayableFormDialog({ open, onOpenChange, record, onSuccess }: Props) {
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({
    supplier_id: '',
    bank_account_id: '',
    description: '',
    amount: 0,
    due_date: '',
    status: 'Pendente',
    payment_method: '',
    paid_at: '',
  })

  useEffect(() => {
    if (!open) return
    Promise.all([getSuppliers(), getActiveBankAccounts()])
      .then(([s, b]) => {
        setSuppliers(s)
        setBankAccounts(b)
      })
      .catch(() => toast.error('Erro ao carregar dados'))
  }, [open])

  useEffect(() => {
    if (record) {
      setForm({
        supplier_id: record.supplier_id || '',
        bank_account_id: record.bank_account_id || '',
        description: record.description || '',
        amount: record.amount || 0,
        due_date: record.due_date ? record.due_date.split('T')[0] : '',
        status: record.status || 'Pendente',
        payment_method: record.payment_method || '',
        paid_at: record.paid_at ? record.paid_at.split('T')[0] : '',
      })
    } else {
      setForm({
        supplier_id: '',
        bank_account_id: '',
        description: '',
        amount: 0,
        due_date: '',
        status: 'Pendente',
        payment_method: '',
        paid_at: '',
      })
    }
    setErrors({})
  }, [record, open])

  const set = (k: keyof typeof form, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setSaving(true)
    setErrors({})
    const data: Record<string, unknown> = {
      supplier_id: form.supplier_id || null,
      bank_account_id: form.bank_account_id || null,
      description: form.description,
      amount: form.amount,
      due_date: form.due_date || null,
      status: form.status,
      payment_method: form.payment_method,
      paid_at: form.status === 'Pago' && form.paid_at ? form.paid_at : null,
    }
    try {
      if (record) {
        await updateAccountsPayable(record.id, data)
        toast.success('Conta a pagar atualizada!')
      } else {
        await createAccountsPayable(data)
        toast.success('Conta a pagar criada!')
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

  const supplierOpts = [NONE, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]
  const bankOpts = [
    NONE,
    ...bankAccounts.map((b) => ({
      value: b.id,
      label: `${b.name} - Ag ${b.agency} - CC ${b.account_number}`,
    })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{record ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <Label>Fornecedor</Label>
            <SearchableSelect
              options={supplierOpts}
              value={form.supplier_id}
              onChange={(v) => set('supplier_id', v)}
              placeholder="Selecionar fornecedor..."
              searchPlaceholder="Buscar fornecedor..."
            />
          </div>
          <div className="space-y-1">
            <Label>Descrição *</Label>
            <Input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descrição..."
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Valor (R$) *</Label>
              <CurrencyInput value={form.amount} onChange={(v) => set('amount', v)} />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            </div>
            <div className="space-y-1">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
                placeholder="Ex: Pix, Dinheiro..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Banco</Label>
            <SearchableSelect
              options={bankOpts}
              value={form.bank_account_id}
              onChange={(v) => set('bank_account_id', v)}
              placeholder="Selecionar banco..."
              searchPlaceholder="Buscar banco..."
            />
          </div>
          {form.status === 'Pago' && (
            <div className="space-y-1">
              <Label>Data de Pagamento</Label>
              <Input
                type="date"
                value={form.paid_at}
                onChange={(e) => set('paid_at', e.target.value)}
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
