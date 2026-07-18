import { useEffect, useState, useRef } from 'react'
import { getUsers, updateUser, deleteUser, type User } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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
import { Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => {
    loadData()
  })

  const openEdit = (u: User) => {
    setEditingUser(u)
    setName(u.name)
    setEmail(u.email)
    setAvatarFile(null)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      if (avatarFile) {
        const fd = new FormData()
        fd.append('name', name)
        fd.append('email', email)
        fd.append('avatar', avatarFile)
        await updateUser(editingUser.id, fd)
      } else {
        await updateUser(editingUser.id, { name, email })
      }
      toast.success('Usuário atualizado com sucesso!')
      setSheetOpen(false)
      loadData()
    } catch {
      toast.error('Erro ao atualizar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteUser(deleteTarget.id)
      toast.success('Usuário excluído!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir usuário')
    }
  }

  const avatarUrl = (u: User) =>
    u.avatar ? `${pb.baseUrl}/api/files/users/${u.id}/${u.avatar}` : null

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Usuários</h1>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="even:bg-slate-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        {avatarUrl(u) && <AvatarImage src={avatarUrl(u)!} alt={u.name} />}
                        <AvatarFallback>{u.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      {u.name || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{new Date(u.created).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(u)}
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
            <SheetTitle>Editar Usuário</SheetTitle>
            <SheetDescription>Atualize os dados do usuário.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {avatarFile ? (
                    <AvatarImage src={URL.createObjectURL(avatarFile)} alt="Preview" />
                  ) : editingUser && avatarUrl(editingUser) ? (
                    <AvatarImage src={avatarUrl(editingUser)!} alt={editingUser.name} />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar imagem
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setAvatarFile(f)
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
