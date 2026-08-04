import { Plus, Trash2 } from 'lucide-react'
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
import { VEHICLE_TYPES, FUEL_OPTIONS } from '@/lib/vehicle-options'

export type VehicleRow = {
  id: string
  type: string
  brand: string
  model: string
  year: string
  fuel: string
  placa: string
}

interface VehicleGridProps {
  vehicles: VehicleRow[]
  onChange: (vehicles: VehicleRow[]) => void
  errors?: Record<number, Record<string, string>>
}

let counter = 0
const genId = () => `new-${Date.now()}-${counter++}`

const emptyVehicle = (): VehicleRow => ({
  id: genId(),
  type: '',
  brand: '',
  model: '',
  year: '',
  fuel: '',
  placa: '',
})

export function VehicleGrid({ vehicles, onChange, errors = {} }: VehicleGridProps) {
  const addVehicle = () => {
    onChange([...vehicles, emptyVehicle()])
  }

  const removeVehicle = (index: number) => {
    onChange(vehicles.filter((_, i) => i !== index))
  }

  const updateField = (index: number, field: keyof VehicleRow, value: string) => {
    onChange(vehicles.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle, index) => (
        <div key={vehicle.id} className="relative rounded-lg border p-4 space-y-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700"
            onClick={() => removeVehicle(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-8">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={vehicle.type} onValueChange={(v) => updateField(index, 'type', v)}>
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
              {errors[index]?.type && <p className="text-xs text-red-500">{errors[index].type}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Marca *</Label>
              <Input
                value={vehicle.brand}
                onChange={(e) => updateField(index, 'brand', e.target.value)}
              />
              {errors[index]?.brand && (
                <p className="text-xs text-red-500">{errors[index].brand}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Modelo *</Label>
              <Input
                value={vehicle.model}
                onChange={(e) => updateField(index, 'model', e.target.value)}
              />
              {errors[index]?.model && (
                <p className="text-xs text-red-500">{errors[index].model}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input
                value={vehicle.year}
                onChange={(e) => updateField(index, 'year', e.target.value)}
                maxLength={4}
                inputMode="numeric"
                className="w-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Combustível</Label>
              <Select value={vehicle.fuel} onValueChange={(v) => updateField(index, 'fuel', v)}>
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
                value={vehicle.placa}
                onChange={(e) => updateField(index, 'placa', e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addVehicle} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Veículo
      </Button>
    </div>
  )
}
