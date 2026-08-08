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
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import { getActiveBankAccounts, type BankAccount } from '@/services/bank-accounts'
import { updateAccountsPayable, type AccountsPayable } from '@/services/accounts-payable'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useFormKeyboard } from '@/hooks/use-form-keyboard'

const NONE = { value: '', label: 'Nenhum' }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: AccountsPayable | null
  onSuccess: () => void
}

export function PayAccountDialog({ open, onOpenChange, record, onSuccess }: Props) {
  const keyboardRef = useFormKeyboard<HTMLDivElement>()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [bankAccountId, setBankAccountId] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    getActiveBankAccounts()
      .then(setBankAccounts)
      .catch(() => toast.error('Erro ao carregar bancos'))
  }, [open])

  useEffect(() => {
    if (record) {
      setBankAccountId(record.bank_account_id || '')
      setPaidAt(new Date().toISOString().split('T')[0])
    }
  }, [record, open])

  const handleSubmit = async () => {
    if (!bankAccountId) {
      toast.error('Informe o banco de origem do pagamento para continuar')
      return
    }
    setSaving(true)
    try {
      await updateAccountsPayable(record!.id, {
        status: 'Pago',
        paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
        bank_account_id: bankAccountId,
      })
      toast.success('Pagamento registrado com sucesso!')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao registrar pagamento')
    } finally {
      setSaving(false)
    }
  }

  const bankOpts = [
    NONE,
    ...bankAccounts.map((b) => ({ value: b.id, label: b.trading_name || b.name })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={keyboardRef} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Banco *</Label>
            <SearchableSelect
              options={bankOpts}
              value={bankAccountId}
              onChange={setBankAccountId}
              placeholder="Selecionar..."
              searchPlaceholder="Buscar..."
            />
          </div>
          <div className="space-y-1">
            <Label>Data de Pagamento *</Label>
            <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
