import { useEffect, useState, useMemo } from 'react'
import {
  getAccountCategories,
  deleteAccountCategory,
  type AccountCategory,
} from '@/services/account-categories'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { AccountCategoryForm } from '@/components/admin/AccountCategoryForm'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TreeNode extends AccountCategory {
  children: TreeNode[]
  level: number
}

function buildTree(categories: AccountCategory[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  const sorted = [...categories].sort((a, b) => {
    const ca = a.code || ''
    const cb = b.code || ''
    return ca.localeCompare(cb, undefined, { numeric: true })
  })

  for (const c of sorted) {
    map.set(c.id, { ...c, children: [], level: 0 })
  }

  for (const c of sorted) {
    const node = map.get(c.id)!
    if (c.parent_id && map.has(c.parent_id)) {
      const parent = map.get(c.parent_id)!
      node.level = parent.level + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []
  for (const node of nodes) {
    result.push(node)
    result.push(...flattenTree(node.children))
  }
  return result
}

export default function AccountCategoriesPage() {
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AccountCategory | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<AccountCategory | null>(null)

  const loadData = async () => {
    try {
      const data = await getAccountCategories()
      setCategories(data)
    } catch {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('account_categories', () => {
    loadData()
  })

  const tree = useMemo(() => buildTree(categories), [categories])
  const flat = useMemo(() => flattenTree(tree), [tree])

  const filtered = useMemo(() => {
    if (!search.trim()) return flat
    const q = search.toLowerCase()
    return flat.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q),
    )
  }, [flat, search])

  const openCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const openEdit = (c: AccountCategory) => {
    setEditing(c)
    setSheetOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAccountCategory(deleteTarget.id)
      toast.success('Categoria excluída!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir categoria')
    }
  }

  const typeColor = (type: string) =>
    type === 'Receita'
      ? 'bg-green-100 text-green-700 hover:bg-green-100'
      : 'bg-red-100 text-red-700 hover:bg-red-100'

  const natureColor = (nature: string) =>
    nature === 'Sintética'
      ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-100'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Plano de Contas</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nova Categoria
        </Button>
      </div>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Tipo</TableHead>
              <TableHead className="w-32">Natureza</TableHead>
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
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="even:bg-slate-50">
                  <TableCell className="font-mono text-sm text-slate-600">
                    {c.code || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span
                      className={cn(c.level > 0 && 'text-slate-600')}
                      style={{ paddingLeft: `${c.level * 20}px` }}
                    >
                      {c.level > 0 && '└ '}
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={typeColor(c.type)}>
                      {c.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={natureColor(c.nature)}>
                      {c.nature}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(c)}
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

      <AccountCategoryForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        onSaved={loadData}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        description={`Tem certeza que deseja excluir a categoria "${deleteTarget?.name}"?`}
      />
    </div>
  )
}
