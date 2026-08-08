import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import { getActiveBankAccounts, type BankAccount } from '@/services/bank-accounts'
import { updateAccountsPayable, type AccountsPayable } from '@/services/accounts-payable'
import { toast } from 'sonner'
import { Loader2, CheckCircle } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    getActiveBankAccounts()
      .then((b) => setBankAccounts(b))
      .catch(() => toast.error('Erro ao carregar contas bancárias'))
  }, [open])

  useEffect(() => {
    if (open && record) {
      setBankAccountId(record.bank_account_id || '')
    } else {
      setBankAccountId('')
    }
    setError('')
  }, [record, open])

  const bankOpts = [
    NONE,
    ...bankAccounts.map((b) => ({ value: b.id, label: b.trading_name || b.name })),
  ]

  const handleSubmit = async () => {
    if (!record) return
    if (!bankAccountId) {
      setError('Informe o banco de origem do pagamento para continuar.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateAccountsPayable(record.id, {
        status: 'Pago',
        paid_at: new Date().toISOString(),
        bank_account_id: bankAccountId,
      })
      toast.success('Conta marcada como paga!')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao atualizar conta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={keyboardRef} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Informe o banco de origem do pagamento para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Conta Bancária *</Label>
            <SearchableSelect
              options={bankOpts}
              value={bankAccountId}
              onChange={(v) => {
                setBankAccountId(v)
                setError('')
              }}
              placeholder="Selecionar conta bancária..."
              searchPlaceholder="Buscar conta..."
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          {record && (
            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600">
              <p>
                <span className="font-medium">Descrição:</span> {record.description || '-'}
              </p>
              <p>
                <span className="font-medium">Valor:</span>{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(record.amount || 0)}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="text-green-600 hover:bg-green-50 hover:text-green-700"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
