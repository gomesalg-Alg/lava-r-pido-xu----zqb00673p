import { useEffect, useState } from 'react'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react'
import { getPageViewsStats, type PageView } from '@/services/analytics'

export default function AdminDashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState<{ total: number; today: number; recent: PageView[] } | null>(
    null,
  )
  const [isLoadingStats, setIsLoadingStats] = useState(false)

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

  const loadAnalytics = async () => {
    setIsLoadingStats(true)
    try {
      const data = await getPageViewsStats()
      setStats(data)
    } catch (e) {
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setIsLoadingStats(false)
    }
  }

  useEffect(() => {
    loadData()
    loadAnalytics()
  }, [])

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
    <div className="max-w-5xl mx-auto">
      <main>
        <Tabs defaultValue="services">
          <TabsList className="mb-6">
            <TabsTrigger value="services">Preços</TabsTrigger>
            <TabsTrigger value="analytics">Monitoramento</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Preços</h2>
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
                      <p className="text-sm text-slate-500">
                        {service.description || 'Sem descrição'}
                      </p>
                      <p className="text-sm font-medium mt-1 text-primary">
                        {service.is_starting_price ? 'A partir de ' : ''}R${' '}
                        {service.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openSheet(service)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Monitoramento</h2>
              <Button onClick={loadAnalytics} disabled={isLoadingStats} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Total de Visitas</h3>
                  <p className="text-4xl font-bold text-slate-900">{stats?.total || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">
                    Visitas nas últimas 24h
                  </h3>
                  <p className="text-4xl font-bold text-slate-900">{stats?.today || 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Data / Hora</TableHead>
                      <TableHead>Caminho</TableHead>
                      <TableHead>Navegador (User Agent)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.recent && stats.recent.length > 0 ? (
                      stats.recent.map((view) => (
                        <TableRow key={view.id}>
                          <TableCell className="font-medium">
                            {new Date(view.created).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>{view.path}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={view.user_agent}>
                            {view.user_agent || 'Desconhecido'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6 text-slate-500">
                          Nenhuma visita registrada ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
