import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { createCardRate, updateCardRate, type CardRate } from '@/services/card-rates'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  rate?: CardRate | null
  onSaved: () => void
}

export function CardRateFormDialog({ open, onOpenChange, rate, onSaved }: Props) {
  const [flag, setFlag] = useState('')
  const [debitRate, setDebitRate] = useState('')
  const [credit1x, setCredit1x] = useState('')
  const [credit2x, setCredit2x] = useState('')
  const [credit3x, setCredit3x] = useState('')
  const [credit4x, setCredit4x] = useState('')
  const [maxInstallments, setMaxInstallments] = useState('4')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFlag(rate?.flag || '')
      setDebitRate(rate?.debit_rate != null ? String(rate.debit_rate) : '')
      setCredit1x(rate?.credit_1x_rate != null ? String(rate.credit_1x_rate) : '')
      setCredit2x(rate?.credit_2x_rate != null ? String(rate.credit_2x_rate) : '')
      setCredit3x(rate?.credit_3x_rate != null ? String(rate.credit_3x_rate) : '')
      setCredit4x(rate?.credit_4x_rate != null ? String(rate.credit_4x_rate) : '')
      setMaxInstallments(rate?.max_installments != null ? String(rate.max_installments) : '4')
      setIsActive(rate?.is_active ?? true)
    }
  }, [open, rate])

  const handleSave = async () => {
    if (!flag.trim()) {
      toast.error('Informe o nome da bandeira')
      return
    }
    setSaving(true)
    try {
      const data = {
        flag: flag.trim(),
        debit_rate: parseFloat(debitRate) || 0,
        credit_1x_rate: parseFloat(credit1x) || 0,
        credit_2x_rate: parseFloat(credit2x) || 0,
        credit_3x_rate: parseFloat(credit3x) || 0,
        credit_4x_rate: parseFloat(credit4x) || 0,
        max_installments: parseInt(maxInstallments) || 4,
        is_active: isActive,
      }
      if (rate) {
        await updateCardRate(rate.id, data)
        toast.success('Bandeira atualizada!')
      } else {
        await createCardRate(data)
        toast.success('Bandeira cadastrada!')
      }
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error('Erro ao salvar bandeira')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rate ? 'Editar Bandeira' : 'Nova Bandeira'}</DialogTitle>
          <DialogDescription>
            Configure as taxas e parcelamentos da bandeira do cartão.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bandeira *</Label>
            <Input
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Ex: Visa, Mastercard, Amex, Hipercard..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taxa Débito (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={debitRate}
                onChange={(e) => setDebitRate(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Parcelas Máx. *</Label>
              <Input
                type="number"
                min="1"
                max="4"
                step="1"
                value={maxInstallments}
                onChange={(e) => setMaxInstallments(e.target.value)}
                placeholder="4"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Crédito 1x (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={credit1x}
                onChange={(e) => setCredit1x(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Crédito 2x (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={credit2x}
                onChange={(e) => setCredit2x(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Crédito 3x (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={credit3x}
                onChange={(e) => setCredit3x(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Crédito 4x (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={credit4x}
                onChange={(e) => setCredit4x(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Ativo</Label>
              <p className="text-sm text-slate-500">Bandeiras inativas não aparecem no caixa.</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
