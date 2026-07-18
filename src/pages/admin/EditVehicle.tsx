import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
import { toast } from 'sonner'

const VEHICLE_TYPES = ['Carro', 'Moto', 'Pick-up', 'Caminhonete', 'Van']

export default function EditVehicle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: '', brand: '', model: '', year: '' })

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const v = await getVehicle(id)
        setForm({
          type: v.type,
          brand: v.brand,
          model: v.model,
          year: v.year?.toString() || '',
        })
      } catch {
        toast.error('Erro ao carregar veículo')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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
      })
      toast.success('Veículo atualizado com sucesso!')
      navigate('/admin/veiculos')
    } catch {
      toast.error('Erro ao atualizar veículo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-center py-8 text-slate-400">Carregando...</p>

  return (
    <div className="max-w-lg mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/admin/veiculos">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Veículo</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-6">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
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
        <div className="space-y-2">
          <Label>Marca</Label>
          <Input
            value={form.brand}
            onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Input
            value={form.model}
            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Ano</Label>
          <Input
            type="number"
            value={form.year}
            onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
          />
        </div>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </div>
  )
}
