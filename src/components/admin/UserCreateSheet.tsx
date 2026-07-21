import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createUser, type UserRole } from '@/services/users'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'

interface UserCreateSheetProps {
  onCreated: () => void
}

export function UserCreateSheet({ onCreated }: UserCreateSheetProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [role, setRole] = useState<UserRole>('Operador')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const reset = () => {
    setName('')
    setEmail('')
    setPassword('')
    setPasswordConfirm('')
    setRole('Operador')
    setFieldErrors({})
  }

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (password !== passwordConfirm) {
      toast.error('As senhas não coincidem')
      return
    }
    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }
    setSaving(true)
    setFieldErrors({})
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('email', email)
      fd.append('emailVisibility', 'true')
      fd.append('password', password)
      fd.append('passwordConfirm', passwordConfirm)
      fd.append('role', role)
      await createUser(fd)
      toast.success('Usuário criado com sucesso!')
      setOpen(false)
      reset()
      onCreated()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Novo Usuário</SheetTitle>
          <SheetDescription>Cadastre um novo usuário no sistema.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>Senha *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label>Confirmar Senha *</Label>
            <Input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {fieldErrors.passwordConfirm && (
              <p className="text-sm text-red-500">{fieldErrors.passwordConfirm}</p>
            )}
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
            {fieldErrors.role && <p className="text-sm text-red-500">{fieldErrors.role}</p>}
          </div>
        </div>
        <SheetFooter className="mt-8">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Cadastrar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
