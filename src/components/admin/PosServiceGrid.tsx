import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getServices, type Service } from '@/services/services'
import { formatCurrency } from '@/lib/format'
import { Search } from 'lucide-react'

interface PosServiceGridProps {
  onAdd: (service: { id: string; name: string; price: number }) => void
}

export function PosServiceGrid({ onAdd }: PosServiceGridProps) {
  const [services, setServices] = useState<Service[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => {})
  }, [])

  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">Nenhum serviço encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
          {filtered.map((s) => (
            <Button
              key={s.id}
              variant="outline"
              className="flex flex-col items-center justify-center h-20 p-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => onAdd({ id: s.id, name: s.name, price: s.price || 0 })}
            >
              <span className="text-sm font-medium text-center line-clamp-2">{s.name}</span>
              <span className="text-xs text-slate-500 mt-1">
                {s.is_starting_price ? 'a partir de ' : ''}
                {formatCurrency(s.price || 0)}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
