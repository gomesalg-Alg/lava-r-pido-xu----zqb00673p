import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  type Service,
} from '@/services/services'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { LogOut, Plus, Trash2, Edit } from 'lucide-react'

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [isStartingPrice, setIsStartingPrice] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const loadData = async () => {
    try {
      const data = await getServices()
      setServices(data)
    } catch (e) {
      toast.error('Erro ao carregar serviços')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return
    try {
      await deleteService(id)
      toast.success('Serviço removido')
      loadData()
    } catch (e) {
      toast.error('Erro ao remover')
    }
  }

  const openSheet = (service?: Service) => {
    setFieldErrors({})
    if (service) {
      setEditingId(service.id)
      setName(service.name)
      setDescription(service.description)
      setPrice(service.price)
      setIsStartingPrice(service.is_starting_price)
      setSortOrder(service.sort_order)
    } else {
      setEditingId(null)
      setName('')
      setDescription('')
      setPrice(0)
      setIsStartingPrice(false)
      setSortOrder(services.length + 1)
    }
    setIsSheetOpen(true)
  }

  const handleSave = async () => {
    try {
      setFieldErrors({})
      const payload = {
        name,
        description,
        price,
        is_starting_price: isStartingPrice,
        sort_order: sortOrder,
      }
      if (editingId) {
        await updateService(editingId, payload)
        toast.success('Serviço atualizado')
      } else {
        await createService(payload)
        toast.success('Serviço criado')
      }
      setIsSheetOpen(false)
      loadData()
    } catch (error) {
      setFieldErrors(extractFieldErrors(error))
      toast.error('Verifique os campos do formulário.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Painel de Preços</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Serviços</h2>
          <Button onClick={() => openSheet()} variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className="bg-white border border-slate-200">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg">{service.name}</h3>
                  <p className="text-sm text-slate-500">{service.description || 'Sem descrição'}</p>
                  <p className="text-sm font-medium mt-1 text-primary">
                    {service.is_starting_price ? 'A partir de ' : ''}R${' '}
                    {service.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openSheet(service)}>
                    <Edit className="w-4 h-4 mr-2" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</SheetTitle>
            <SheetDescription>Preencha os detalhes do serviço.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Serviço</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              {fieldErrors.description && (
                <p className="text-sm text-red-500">{fieldErrors.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              />
              {fieldErrors.price && <p className="text-sm text-red-500">{fieldErrors.price}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isStartingPrice"
                checked={isStartingPrice}
                onCheckedChange={(c) => setIsStartingPrice(!!c)}
              />
              <Label htmlFor="isStartingPrice" className="cursor-pointer">
                Exibir "A partir de"
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Ordem de Exibição (Número)</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <SheetFooter className="mt-8">
            <Button onClick={handleSave} className="w-full">
              Salvar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
