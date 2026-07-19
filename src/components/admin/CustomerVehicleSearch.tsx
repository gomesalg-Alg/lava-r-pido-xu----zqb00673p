import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchByPlacaOrCpf, type CustomerVehicleSearchResult } from '@/services/service-orders'
import type { Customer } from '@/services/customers'
import type { Vehicle } from '@/services/vehicles'
import { Search, Car, User } from 'lucide-react'

interface Props {
  onSelect: (customer: Customer, vehicle: Vehicle) => void
  selectedCustomer?: Customer | null
  selectedVehicle?: Vehicle | null
}

export function CustomerVehicleSearch({ onSelect, selectedCustomer, selectedVehicle }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CustomerVehicleSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    setLoading(true)
    try {
      const data = await searchByPlacaOrCpf(value)
      setResults(data)
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (r: CustomerVehicleSearchResult) => {
    onSelect(r.customer, r.vehicle)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label>Buscar Cliente / Veículo (Placa ou CPF) *</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Digite a placa ou CPF..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
        {showResults && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-md border shadow-lg max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-slate-400">Buscando...</div>
            ) : results.length === 0 ? (
              <div className="p-3 text-sm text-slate-400">Nenhum resultado encontrado.</div>
            ) : (
              results.map((r) => (
                <button
                  key={r.vehicle.id}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 border-b last:border-0"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {r.customer.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    {r.vehicle.brand} {r.vehicle.model} — {r.vehicle.placa || 'Sem placa'}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {selectedCustomer && selectedVehicle && (
        <div className="p-3 bg-slate-50 rounded-md border text-sm">
          <p className="font-medium text-slate-700">{selectedCustomer.name}</p>
          <p className="text-slate-500">
            {selectedVehicle.brand} {selectedVehicle.model} — {selectedVehicle.placa || 'Sem placa'}
          </p>
        </div>
      )}
    </div>
  )
}
