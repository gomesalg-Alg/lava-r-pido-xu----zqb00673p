import { useEffect, useState } from 'react'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from '@/services/products'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'

const emptyForm = { name: '', description: '', price: '', sku: '', stock_quantity: '' }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const loadData = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('products', () => {
    loadData()
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price?.toString() || '',
      sku: p.sku || '',
      stock_quantity: p.stock_quantity?.toString() || '',
    })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setSaving(true)
    try {
      const data = {
        name: form.name,
        description: form.description,
        price: form.price ? parseFloat(form.price) : null,
        sku: form.sku,
        stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : null,
      }
      if (editing) {
        await updateProduct(editing.id, data)
        toast.success('Produto atualizado!')
      } else {
        await createProduct(data)
        toast.success('Produto cadastrado!')
      }
      setSheetOpen(false)
      loadData()
    } catch {
      toast.error('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
      toast.success('Produto excluído!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir produto')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Produtos</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Novo Produto
        </Button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} className="even:bg-slate-50">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-slate-600">{p.sku || '-'}</TableCell>
                  <TableCell className="text-slate-600">{formatCurrency(p.price)}</TableCell>
                  <TableCell className="text-slate-600">{p.stock_quantity ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(p)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
            <SheetDescription>
              {editing ? 'Atualize os dados do produto.' : 'Cadastre um novo produto.'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter className="mt-8">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
