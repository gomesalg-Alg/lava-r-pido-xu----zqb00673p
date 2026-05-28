import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServices, type ServiceItem } from '@/hooks/use-services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { LogOut, Plus, Trash2, Save } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { services, saveServices, isLoading } = useServices()
  const [localServices, setLocalServices] = useState<ServiceItem[]>([])

  useEffect(() => {
    const isAuth = localStorage.getItem('xua_admin_auth')
    if (!isAuth) {
      navigate('/admin/login')
    }
  }, [navigate])

  useEffect(() => {
    setLocalServices(services)
  }, [services])

  const handleLogout = () => {
    localStorage.removeItem('xua_admin_auth')
    navigate('/admin/login')
  }

  const handleSave = () => {
    saveServices(localServices)
    toast.success('Preços e serviços atualizados com sucesso!')
  }

  const handleUpdate = (id: string, field: keyof ServiceItem, value: any) => {
    setLocalServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const handleDelete = (id: string) => {
    setLocalServices((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAdd = () => {
    const newId = Math.random().toString(36).substring(7)
    setLocalServices((prev) => [...prev, { id: newId, title: 'Novo Serviço', price: 0 }])
  }

  if (isLoading) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Painel de Preços - XUÁ</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2 hidden sm:block" />
              Sair
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2 hidden sm:block" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Serviços e Informações</h2>
          <Button onClick={handleAdd} variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        <div className="grid gap-4">
          {localServices.map((service) => (
            <Card key={service.id} className="bg-white border border-slate-200">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título / Serviço</Label>
                    <Input
                      value={service.title}
                      onChange={(e) => handleUpdate(service.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtítulo / Descrição</Label>
                    <Input
                      value={service.subtitle || ''}
                      onChange={(e) => handleUpdate(service.id, 'subtitle', e.target.value)}
                      placeholder="(opcional)"
                    />
                  </div>

                  {!service.isInfo && (
                    <>
                      <div className="space-y-2">
                        <Label>Prefixo de Preço</Label>
                        <Input
                          value={service.pricePrefix || ''}
                          onChange={(e) => handleUpdate(service.id, 'pricePrefix', e.target.value)}
                          placeholder="Ex: a partir de"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={service.price ?? 0}
                          onChange={(e) =>
                            handleUpdate(service.id, 'price', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-4 shrink-0 sm:w-32 sm:pt-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`isInfo-${service.id}`}
                      checked={!!service.isInfo}
                      onCheckedChange={(checked) => handleUpdate(service.id, 'isInfo', checked)}
                    />
                    <Label htmlFor={`isInfo-${service.id}`} className="text-sm cursor-pointer">
                      Apenas Info
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {localServices.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
              Nenhum serviço cadastrado. Clique em "Adicionar Item" para começar.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
