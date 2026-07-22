import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getCardRates, updateCardRate, type CardRate } from '@/services/card-rates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

const RATE_FIELDS: { key: keyof CardRate; label: string }[] = [
  { key: 'debit_rate', label: 'Débito (%)' },
  { key: 'credit_1x_rate', label: 'Créd. 1x (%)' },
  { key: 'credit_2x_rate', label: 'Créd. 2x (%)' },
  { key: 'credit_3x_rate', label: 'Créd. 3x (%)' },
  { key: 'credit_4x_rate', label: 'Créd. 4x (%)' },
]

export default function CardRatesPage() {
  const { user } = useAuth()
  const [rates, setRates] = useState<CardRate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      setRates(await getCardRates())
    } catch {
      toast.error('Erro ao carregar taxas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('card_rates', () => {
    loadData()
  })

  if (user?.role !== 'Administrador') return <Navigate to="/admin" replace />

  const updateRate = (id: string, patch: Partial<CardRate>) =>
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(
        rates.map((r) =>
          updateCardRate(r.id, {
            debit_rate: r.debit_rate,
            credit_1x_rate: r.credit_1x_rate,
            credit_2x_rate: r.credit_2x_rate,
            credit_3x_rate: r.credit_3x_rate,
            credit_4x_rate: r.credit_4x_rate,
            is_active: r.is_active,
          }),
        ),
      )
      toast.success('Taxas atualizadas com sucesso!')
    } catch {
      toast.error('Erro ao salvar taxas')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Bandeiras e Taxas</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bandeira</TableHead>
                {RATE_FIELDS.map((f) => (
                  <TableHead key={f.key}>{f.label}</TableHead>
                ))}
                <TableHead>Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhuma bandeira encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.flag}</TableCell>
                    {RATE_FIELDS.map((f) => (
                      <TableCell key={f.key}>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          value={rate[f.key] as number}
                          onChange={(e) =>
                            updateRate(rate.id, {
                              [f.key]: parseFloat(e.target.value) || 0,
                            } as Partial<CardRate>)
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Switch
                        checked={rate.is_active}
                        onCheckedChange={(v) => updateRate(rate.id, { is_active: v })}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
