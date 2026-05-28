import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Droplets } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // Mock authentication per acceptance criteria
    if (email === 'admin@xua.com.br' && password === 'admin123') {
      localStorage.setItem('xua_admin_auth', 'true')
      toast.success('Login realizado com sucesso')
      navigate('/admin')
    } else {
      toast.error('Credenciais inválidas. Use admin@xua.com.br / admin123')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center justify-center gap-2 text-primary">
        <Droplets size={32} />
        <span className="text-2xl font-bold tracking-tight">Lava Rápido XUÁ</span>
      </div>
      <Card className="w-full max-w-md shadow-xl border-2 border-slate-100">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Área Administrativa</CardTitle>
          <CardDescription className="text-center">
            Digite suas credenciais para gerenciar os preços
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@xua.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-base font-semibold">
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
