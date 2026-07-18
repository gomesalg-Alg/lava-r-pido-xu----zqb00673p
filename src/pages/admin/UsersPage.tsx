import { useEffect, useState } from 'react'
import { getUsers, createUser, deleteUser, type AdminUser } from '@/services/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { toast } from 'sonner'
import { Plus, Trash2, Users } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setUsers(await getUsers())
    } catch {
      toast.error('Erro ao carregar usuários')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Preencha e-mail e senha')
      return
    }
    setSaving(true)
    try {
      await createUser({ name, email, password, passwordConfirm: password })
      toast.success('Usuário criado!')
      setIsOpen(false)
      setName('')
      setEmail('')
      setPassword('')
      load()
    } catch {
      toast.error('Erro ao criar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return
    try {
      await deleteUser(id)
      toast.success('Usuário removido')
      load()
    } catch {
      toast.error('Erro ao remover')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={28} />
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
        </div>
        <Button onClick={() => setIsOpen(true)} variant="secondary" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || '—'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{new Date(u.created).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>Novo Usuário</SheetTitle>
            <SheetDescription>Crie um novo operador ou administrador.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter className="mt-8">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : 'Criar Usuário'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
