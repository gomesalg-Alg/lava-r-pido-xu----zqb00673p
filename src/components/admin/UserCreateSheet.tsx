import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'
import { createUser } from '@/services/users'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface UserCreateSheetProps {
  onCreated: () => void
}

export function UserCreateSheet({ onCreated }: UserCreateSheetProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setName('')
    setEmail('')
    setPassword('')
    setAvatarFile(null)
    setErrors({})
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Obrigatório'
    if (!email.trim()) e.email = 'Obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido'
    if (!password) e.password = 'Obrigatório'
    else if (password.length < 8) e.password = 'Mínimo de 8 caracteres'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('email', email)
      fd.append('password', password)
      fd.append('passwordConfirm', password)
      fd.append('verified', 'true')
      if (avatarFile) fd.append('avatar', avatarFile)
      await createUser(fd)
      toast.success('Usuário criado com sucesso!')
      setOpen(false)
      reset()
      onCreated()
    } catch {
      toast.error('Erro ao criar usuário')
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
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                {avatarFile && <AvatarImage src={URL.createObjectURL(avatarFile)} alt="Preview" />}
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
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>Senha *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>
        </div>
        <SheetFooter className="mt-8">
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
