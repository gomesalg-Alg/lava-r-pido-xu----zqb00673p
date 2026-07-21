import { useEffect, useState, useRef } from 'react'
import { getUsers, updateUser, deleteUser, type User, type UserRole } from '@/services/users'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { Edit, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { UserCreateSheet } from '@/components/admin/UserCreateSheet'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('Operador')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
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

  const avatarUrl = (u: User) =>
    u.avatar ? `${pb.baseUrl}/api/files/users/${u.id}/${u.avatar}` : null

  const openEdit = (u: User) => {
    setEditingUser(u)
    setName(u.name)
    setEmail(u.email)
    setRole(u.role || 'Operador')
    setAvatarFile(null)
    setRemoveAvatar(false)
    setNewPassword('')
    setConfirmPassword('')
    setFieldErrors({})
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!editingUser) return
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (newPassword && newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }

    setSaving(true)
    setFieldErrors({})

    try {
      const hasFileOperation = !!avatarFile || removeAvatar

      if (hasFileOperation) {
        const fd = new FormData()
        fd.append('name', name)
        fd.append('email', email)
        fd.append('role', role)

        if (avatarFile) {
          fd.append('avatar', avatarFile)
        } else if (removeAvatar) {
          fd.append('avatar', '')
        }

        if (newPassword) {
          fd.append('password', newPassword)
          fd.append('passwordConfirm', confirmPassword)
        }

        await updateUser(editingUser.id, fd)
      } else {
        const data: Record<string, string> = {
          name,
          email,
          role,
        }

        if (newPassword) {
          data.password = newPassword
          data.passwordConfirm = confirmPassword
        }

        await updateUser(editingUser.id, data)
      }

      toast.success('Usuário atualizado com sucesso!')
      setSheetOpen(false)
      loadData()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(getErrorMessage(err))
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

  const showAvatarPreview = avatarFile
    ? URL.createObjectURL(avatarFile)
    : !removeAvatar && editingUser && avatarUrl(editingUser)
      ? avatarUrl(editingUser)!
      : null

  const hasAvatar = !!avatarFile || (!removeAvatar && !!editingUser?.avatar)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
        <UserCreateSheet onCreated={loadData} />
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil de Acesso</TableHead>
              <TableHead>Criado em</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
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
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        u.role === 'Administrador'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700',
                      )}
                    >
                      {u.role || 'Operador'}
                    </span>
                  </TableCell>
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
                  {showAvatarPreview && <AvatarImage src={showAvatarPreview} alt="Preview" />}
                  <AvatarFallback className="text-lg">
                    {name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar imagem
                  </Button>
                  {hasAvatar && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRemoveAvatar(true)
                        setAvatarFile(null)
                      }}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-1" /> Excluir Imagem
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setAvatarFile(f)
                      setRemoveAvatar(false)
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Operador">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-slate-500 mb-3">
                Deixe os campos de senha em branco para manter a senha atual.
              </p>
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>
              <div className="space-y-2 mt-4">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {fieldErrors.passwordConfirm && (
                  <p className="text-sm text-red-500">{fieldErrors.passwordConfirm}</p>
                )}
              </div>
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
