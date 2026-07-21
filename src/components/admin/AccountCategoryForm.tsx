import { useState, useEffect } from 'react'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  type AccountCategory,
  type AccountType,
  type AccountNature,
  type AccountCategoryFormData,
  getSyntheticParents,
} from '@/services/account-categories'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: AccountCategory | null
  onSaved: () => void
}

const emptyForm: AccountCategoryFormData = {
  name: '',
  code: '',
  type: 'Receita',
  nature: 'Sintética',
  parent_id: null,
}

export function AccountCategoryForm({ open, onOpenChange, editing, onSaved }: Props) {
  const [form, setForm] = useState<AccountCategoryFormData>(emptyForm)
  const [parents, setParents] = useState<AccountCategory[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name || '',
          code: editing.code || '',
          type: editing.type || 'Receita',
          nature: editing.nature || 'Sintética',
          parent_id: editing.parent_id || null,
        })
      } else {
        setForm(emptyForm)
      }
    }
  }, [open, editing])

  useEffect(() => {
    if (open) {
      loadParents(form.type)
    }
  }, [open, form.type])

  const loadParents = async (type: AccountType) => {
    try {
      const data = await getSyntheticParents(type)
      const filtered = editing ? data.filter((p) => p.id !== editing.id) : data
      setParents(filtered)
    } catch {
      setParents([])
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!form.type) {
      toast.error('Tipo é obrigatório')
      return
    }
    if (!form.nature) {
      toast.error('Natureza é obrigatória')
      return
    }

    const selectedParent = parents.find((p) => p.id === form.parent_id)
    if (selectedParent && selectedParent.type !== form.type) {
      toast.error('O Tipo deve ser igual ao da conta pai')
      return
    }

    setSaving(true)
    try {
      const payload: AccountCategoryFormData = {
        ...form,
        parent_id: form.parent_id || null,
      }
      if (editing) {
        await updateAccountCategory(editing.id, payload)
        toast.success('Categoria atualizada!')
      } else {
        await createAccountCategory(payload)
        toast.success('Categoria cadastrada!')
      }
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error('Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>{editing ? 'Editar Categoria' : 'Nova Categoria'}</SheetTitle>
          <SheetDescription>
            {editing
              ? 'Atualize os dados da categoria de conta.'
              : 'Cadastre uma nova categoria no plano de contas.'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Código</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="Ex: 1.1.01"
            />
          </div>
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Lavagem Completa"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={form.type}
                onValueChange={(v: AccountType) =>
                  setForm((p) => ({ ...p, type: v, parent_id: null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Natureza *</Label>
              <Select
                value={form.nature}
                onValueChange={(v: AccountNature) =>
                  setForm((p) => ({ ...p, nature: v, parent_id: null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sintética">Sintética</SelectItem>
                  <SelectItem value="Analítica">Analítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Conta Pai</Label>
            <Select
              value={form.parent_id || '__none__'}
              onValueChange={(v: string) =>
                setForm((p) => ({ ...p, parent_id: v === '__none__' ? null : v }))
              }
              disabled={form.nature === 'Sintética' && !form.parent_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhuma (Conta Raiz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma (Conta Raiz)</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code ? `${p.code} - ${p.name}` : p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.nature === 'Analítica' && parents.length === 0 && (
              <p className="text-xs text-amber-600">
                Nenhuma conta Sintética disponível para este Tipo. Crie uma conta Sintética
                primeiro.
              </p>
            )}
          </div>
        </div>
        <SheetFooter className="mt-8">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
