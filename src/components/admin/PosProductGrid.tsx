import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getProducts, type Product } from '@/services/products'
import { Search } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface Props {
  onAdd: (product: Product) => void
}

export function PosProductGrid({ onAdd }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => {})
  }, [])

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
        {filtered.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            className="h-auto flex flex-col items-start p-3 gap-1 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            onClick={() => onAdd(p)}
          >
            <span className="text-sm font-medium text-left line-clamp-2">{p.name}</span>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(p.price)}</span>
          </Button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-slate-400 py-8 text-sm">
            Nenhum produto encontrado.
          </p>
        )}
      </div>
    </div>
  )
}
