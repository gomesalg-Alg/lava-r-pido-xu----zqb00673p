import { useEffect, useState } from 'react'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  type Service,
} from '@/services/services'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

const emptyForm = {
  name: '',
  description: '',
  price: '',
  is_starting_price: false,
  sort_order: '0',
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const loadData = async () => {
    try {
      const data = await getServices()
      setServices(data)
    } catch {
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('services', () => {
    loadData()
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({
      name: s.name || '',
      description: s.description || '',
      price: s.price?.toString() || '',
      is_starting_price: s.is_starting_price || false,
      sort_order: s.sort_order?.toString() || '0',
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
        is_starting_price: form.is_starting_price,
        sort_order: form.sort_order ? parseInt(form.sort_order) : 0,
      }
      if (editing) {
        await updateService(editing.id, data)
        toast.success('Serviço atualizado!')
      } else {
        await createService(data)
        toast.success('Serviço cadastrado!')
      }
      setSheetOpen(false)
      loadData()
    } catch {
      toast.error('Erro ao salvar serviço')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteService(deleteTarget.id)
      toast.success('Serviço excluído!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir serviço')
    }
  }

  const fmtPrice = (p: number, starting: boolean) => {
    const f = p?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'
    return starting ? `${f}*` : f
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tabela de Preços</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Novo Serviço
        </Button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Ordem</TableHead>
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
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id} className="even:bg-slate-50">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-slate-600">
                    {s.description || '-'}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {fmtPrice(s.price, s.is_starting_price)}
                  </TableCell>
                  <TableCell className="text-slate-600">{s.sort_order ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(s)}
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
            <SheetTitle>{editing ? 'Editar Serviço' : 'Novo Serviço'}</SheetTitle>
            <SheetDescription>
              {editing ? 'Atualize os dados do serviço.' : 'Cadastre um novo serviço.'}
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
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={form.is_starting_price}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_starting_price: v }))}
              />
              <Label>Preço inicial?</Label>
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
