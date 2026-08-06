import { useState, useEffect } from 'react'
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
        <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 z-10">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Serviço</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 hidden sm:table-cell">
                  Descrição
                </th>
                <th className="text-right px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">
                  Preço
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-t cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => onAdd({ id: s.id, name: s.name, price: s.price || 0 })}
                >
                  <td className="px-3 py-2 font-medium align-top">{s.name}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs hidden sm:table-cell align-top max-w-[200px]">
                    <span className="block line-clamp-2">{s.description || '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-blue-600 whitespace-nowrap align-top">
                    {s.is_starting_price ? 'a partir de ' : ''}
                    {formatCurrency(s.price || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
