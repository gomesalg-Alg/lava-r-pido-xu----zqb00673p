import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
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
import { getVehicle, updateVehicle } from '@/services/vehicles'
import { VEHICLE_TYPES, FUEL_OPTIONS } from '@/lib/vehicle-options'
import { maskPlaca } from '@/lib/masks'
import { toast } from 'sonner'

export default function EditVehicle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    type: '',
    brand: '',
    model: '',
    year: '',
    fuel: '',
    placa: '',
  })
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const v = await getVehicle(id)
        setForm({
          type: v.type || '',
          brand: v.brand || '',
          model: v.model || '',
          year: v.year?.toString() || '',
          fuel: v.fuel || '',
          placa: v.placa || '',
        })
        setCustomerName((v as any)?.expand?.customer_id?.name || '')
      } catch {
        toast.error('Veículo não encontrado')
        navigate('/admin/veiculos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const set = (k: string, val: string) => setForm((p) => ({ ...p, [k]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await updateVehicle(id, {
        type: form.type,
        brand: form.brand,
        model: form.model,
        year: form.year ? parseInt(form.year) : null,
        fuel: form.fuel,
        placa: form.placa,
      })
      toast.success('Veículo atualizado com sucesso!')
      navigate('/admin/veiculos')
    } catch {
      toast.error('Erro ao atualizar veículo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center text-slate-500 py-8">Carregando...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/admin/veiculos">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Veículo</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border p-6 space-y-4">
          {customerName && (
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input value={customerName} disabled />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Combustível</Label>
              <Select value={form.fuel} onValueChange={(v) => set('fuel', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Placa</Label>
              <Input
                value={form.placa}
                onChange={(e) => set('placa', maskPlaca(e.target.value))}
                placeholder="ABC-1D23"
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Marca *</Label>
              <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo *</Label>
              <Input value={form.model} onChange={(e) => set('model', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => set('year', e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </div>
  )
}
