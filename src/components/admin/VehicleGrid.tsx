import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type VehicleRow = {
  id: string
  type: string
  brand: string
  model: string
  year: string
}

const VEHICLE_TYPES = ['Carro', 'Moto', 'Pick-up', 'Caminhonete', 'Van']

interface Props {
  vehicles: VehicleRow[]
  onChange: (vehicles: VehicleRow[]) => void
  errors: Record<number, Record<string, string>>
}

export function VehicleGrid({ vehicles, onChange, errors }: Props) {
  const add = () =>
    onChange([...vehicles, { id: crypto.randomUUID(), type: '', brand: '', model: '', year: '' }])

  const remove = (id: string) => onChange(vehicles.filter((v) => v.id !== id))

  const update = (id: string, key: keyof VehicleRow, value: string) =>
    onChange(vehicles.map((v) => (v.id === id ? { ...v, [key]: value } : v)))

  return (
    <div className="space-y-3">
      {vehicles.map((v, i) => (
        <div
          key={v.id}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-slate-50"
        >
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-600">Tipo</label>
            <Select value={v.type} onValueChange={(val) => update(v.id, 'type', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[i]?.type && <p className="text-xs text-red-500">{errors[i].type}</p>}
          </div>
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-medium text-slate-600">Marca</label>
            <Input
              value={v.brand}
              onChange={(e) => update(v.id, 'brand', e.target.value)}
              placeholder="Marca"
            />
            {errors[i]?.brand && <p className="text-xs text-red-500">{errors[i].brand}</p>}
          </div>
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-medium text-slate-600">Modelo</label>
            <Input
              value={v.model}
              onChange={(e) => update(v.id, 'model', e.target.value)}
              placeholder="Modelo"
            />
            {errors[i]?.model && <p className="text-xs text-red-500">{errors[i].model}</p>}
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-600">Ano</label>
            <Input
              type="number"
              value={v.year}
              onChange={(e) => update(v.id, 'year', e.target.value)}
              placeholder="Ano"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="button" variant="destructive" size="icon" onClick={() => remove(v.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Veículo
      </Button>
    </div>
  )
}
