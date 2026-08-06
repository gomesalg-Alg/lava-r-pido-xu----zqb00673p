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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createBankAccount, updateBankAccount, type BankAccount } from '@/services/bank-accounts'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useFormKeyboard } from '@/hooks/use-form-keyboard'

const ACCOUNT_TYPES = ['Corrente', 'Poupança']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: BankAccount | null
  onSuccess: () => void
}

export function BankAccountFormDialog({ open, onOpenChange, record, onSuccess }: Props) {
  const keyboardRef = useFormKeyboard<HTMLDivElement>()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({
    name: '',
    trading_name: '',
    agency: '',
    account_number: '',
    account_type: 'Corrente',
    is_active: true,
    registers_cash_register: false,
  })

  useEffect(() => {
    if (record) {
      setForm({
        name: record.name || '',
        trading_name: record.trading_name || '',
        agency: record.agency || '',
        account_number: record.account_number || '',
        account_type: record.account_type || 'Corrente',
        is_active: record.is_active ?? true,
        registers_cash_register: record.registers_cash_register ?? false,
      })
    } else {
      setForm({
        name: '',
        trading_name: '',
        agency: '',
        account_number: '',
        account_type: 'Corrente',
        is_active: true,
        registers_cash_register: false,
      })
    }
    setErrors({})
  }, [record, open])

  const set = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setSaving(true)
    setErrors({})
    try {
      const data = { ...form }
      if (record) {
        await updateBankAccount(record.id, data)
        toast.success('Conta bancária atualizada!')
      } else {
        await createBankAccount(data)
        toast.success('Conta bancária criada!')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar conta bancária')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={keyboardRef} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{record ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Nome do Banco *</Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Banco do Brasil"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label>Nome Fantasia</Label>
            <Input
              value={form.trading_name}
              onChange={(e) => set('trading_name', e.target.value)}
              placeholder="Ex: BB"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Agência *</Label>
              <Input
                value={form.agency}
                onChange={(e) => set('agency', e.target.value)}
                placeholder="Ex: 1234-5"
              />
              {errors.agency && <p className="text-sm text-red-500">{errors.agency}</p>}
            </div>
            <div className="space-y-1">
              <Label>Número da Conta *</Label>
              <Input
                value={form.account_number}
                onChange={(e) => set('account_number', e.target.value)}
                placeholder="Ex: 67890-1"
              />
              {errors.account_number && (
                <p className="text-sm text-red-500">{errors.account_number}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo de Conta *</Label>
              <Select value={form.account_type} onValueChange={(v) => set('account_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.account_type && <p className="text-sm text-red-500">{errors.account_type}</p>}
            </div>
            <div className="space-y-1">
              <Label>Ativo</Label>
              <div className="flex items-center h-9">
                <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Registra movimentos do Frente de Caixa</Label>
            <div className="flex items-center h-9">
              <Switch
                checked={form.registers_cash_register}
                onCheckedChange={(v) => set('registers_cash_register', v)}
              />
              <span className="ml-2 text-sm text-slate-500">
                {form.registers_cash_register ? 'Sim' : 'Não'}
              </span>
            </div>
            {errors.registers_cash_register && (
              <p className="text-sm text-red-500">{errors.registers_cash_register}</p>
            )}
          </div>
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
