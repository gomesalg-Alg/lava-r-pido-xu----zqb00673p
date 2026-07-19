import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomerVehicleSearch } from './CustomerVehicleSearch'
import { ServiceOrderItems, type ItemRow } from './ServiceOrderItems'
import {
  formatCurrency,
  formatDuration,
  toDatetimeLocal,
  fromDatetimeLocal,
  toDateInput,
} from '@/lib/format'
import {
  getServiceOrder,
  getServiceOrderItems,
  createServiceOrder,
  updateServiceOrder,
  getNextTicketNumber,
  createServiceOrderItem,
  updateServiceOrderItem,
  deleteServiceOrderItem,
} from '@/services/service-orders'
import type { Customer } from '@/services/customers'
import type { Vehicle } from '@/services/vehicles'
import { toast } from 'sonner'
import { Save, Camera, Upload } from 'lucide-react'

const STATUSES = ['Orçamento', 'Em Andamento', 'Finalizado']
const PAYMENTS = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito']

interface Props {
  orderId?: string
}

export function ServiceOrderForm({ orderId }: Props) {
  const navigate = useNavigate()
  const isEdit = !!orderId
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const existingItemIds = useRef<string[]>([])

  const [form, setForm] = useState({
    ticket_number: 0,
    prisma_number: '',
    customer_id: '',
    vehicle_id: '',
    emission_date: new Date().toISOString().split('T')[0],
    entry_at: '',
    exit_at: '',
    payment_method: '',
    status: 'Orçamento',
    observation: '',
  })
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [existingPhoto, setExistingPhoto] = useState('')
  const [items, setItems] = useState<ItemRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (orderId) {
      const load = async () => {
        try {
          const order = await getServiceOrder(orderId)
          setForm({
            ticket_number: order.ticket_number || 0,
            prisma_number: order.prisma_number || '',
            customer_id: order.customer_id || '',
            vehicle_id: order.vehicle_id || '',
            emission_date: toDateInput(order.emission_date),
            entry_at: toDatetimeLocal(order.entry_at),
            exit_at: toDatetimeLocal(order.exit_at),
            payment_method: order.payment_method || '',
            status: order.status || 'Orçamento',
            observation: order.observation || '',
          })
          setExistingPhoto(order.photo || '')
          if (order.expand?.customer_id) setCustomer(order.expand.customer_id)
          if (order.expand?.vehicle_id) setVehicle(order.expand.vehicle_id)
          const existingItems = await getServiceOrderItems(orderId)
          existingItemIds.current = existingItems.map((i) => i.id)
          setItems(
            existingItems.map((i) => ({
              id: i.id,
              service_id: i.service_id,
              operator_id: i.operator_id,
              quantity: i.quantity || 1,
              unit_price: i.unit_price || 0,
              discount_amount: i.discount_amount || 0,
              discount_reason: i.discount_reason || '',
              surcharge_amount: i.surcharge_amount || 0,
              surcharge_reason: i.surcharge_reason || '',
            })),
          )
        } catch {
          toast.error('Erro ao carregar ordem de serviço')
        }
      }
      load()
    } else {
      getNextTicketNumber()
        .then((n) => setForm((p) => ({ ...p, ticket_number: n })))
        .catch(() => {})
    }
  }, [orderId])

  const set = (k: string, v: unknown) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => {
      const n = { ...p }
      delete n[k]
      return n
    })
  }

  const handleSelect = (c: Customer, v: Vehicle) => {
    setCustomer(c)
    setVehicle(v)
    setForm((p) => ({ ...p, customer_id: c.id, vehicle_id: v.id }))
    setErrors((p) => {
      const n = { ...p }
      delete n.customer_id
      return n
    })
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setExistingPhoto('')
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.customer_id) e.customer_id = 'Selecione um cliente/veículo'
    if (form.exit_at && form.entry_at && new Date(form.exit_at) < new Date(form.entry_at))
      e.exit_at = 'Saída não pode ser anterior à entrada'
    if (items.length === 0) e.items = 'Adicione pelo menos um item'
    if (items.some((i) => !i.service_id || !i.operator_id))
      e.items = 'Preencha serviço e operador em todos os itens'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) {
      toast.error('Verifique os campos do formulário')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        ticket_number: form.ticket_number,
        prisma_number: form.prisma_number,
        customer_id: form.customer_id,
        vehicle_id: form.vehicle_id,
        emission_date: form.emission_date || null,
        entry_at: fromDatetimeLocal(form.entry_at),
        exit_at: fromDatetimeLocal(form.exit_at),
        payment_method: form.payment_method || null,
        status: form.status,
        observation: form.observation,
      }
      if (photo) payload.photo = photo

      let savedOrderId: string
      if (isEdit && orderId) {
        await updateServiceOrder(orderId, payload)
        savedOrderId = orderId
      } else {
        const created = await createServiceOrder(payload)
        savedOrderId = created.id
      }

      const currentItemIds = items.filter((i) => i.id).map((i) => i.id!)
      for (const oldId of existingItemIds.current) {
        if (!currentItemIds.includes(oldId)) await deleteServiceOrderItem(oldId)
      }
      for (const item of items) {
        const itemData: Record<string, unknown> = {
          order_id: savedOrderId,
          service_id: item.service_id,
          operator_id: item.operator_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          discount_reason: item.discount_reason,
          surcharge_amount: item.surcharge_amount,
          surcharge_reason: item.surcharge_reason,
          total_price:
            (item.quantity || 0) * (item.unit_price || 0) -
            (item.discount_amount || 0) +
            (item.surcharge_amount || 0),
        }
        if (item.id && existingItemIds.current.includes(item.id)) {
          await updateServiceOrderItem(item.id, itemData)
        } else {
          await createServiceOrderItem(itemData)
        }
      }

      toast.success(isEdit ? 'Ordem de serviço atualizada!' : 'Ordem de serviço criada!')
      navigate('/admin/ordem-servico')
    } catch {
      toast.error(isEdit ? 'Erro ao atualizar ordem' : 'Erro ao criar ordem')
    } finally {
      setSaving(false)
    }
  }

  const photoUrl = photo
    ? URL.createObjectURL(photo)
    : existingPhoto && orderId
      ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/service_orders/${orderId}/${existingPhoto}`
      : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Cabeçalho da Ordem</h2>
          <div className="text-right">
            <Label className="text-xs text-slate-400">Nº Ticket</Label>
            <p className="text-xl font-bold text-blue-600">
              {String(form.ticket_number).padStart(4, '0')}
            </p>
          </div>
        </div>
        <CustomerVehicleSearch
          onSelect={handleSelect}
          selectedCustomer={customer}
          selectedVehicle={vehicle}
        />
        {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Data de Emissão</Label>
            <Input
              type="date"
              value={form.emission_date}
              onChange={(e) => set('emission_date', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Entrada</Label>
            <Input
              type="datetime-local"
              value={form.entry_at}
              onChange={(e) => set('entry_at', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Saída</Label>
            <Input
              type="datetime-local"
              value={form.exit_at}
              onChange={(e) => set('exit_at', e.target.value)}
            />
            {errors.exit_at && <p className="text-xs text-red-500">{errors.exit_at}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Tempo de Permanência</Label>
            <Input
              readOnly
              value={formatDuration(form.entry_at, form.exit_at)}
              className="bg-slate-50 font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Forma de Pagamento</Label>
            <Select value={form.payment_method} onValueChange={(v) => set('payment_method', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENTS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nº Prisma</Label>
            <Input
              value={form.prisma_number}
              onChange={(e) => set('prisma_number', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Foto da Placa</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handlePhoto}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/png,image/jpeg"
                capture="environment"
                onChange={handlePhoto}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" /> Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-1" /> Câmera
              </Button>
            </div>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Placa"
                className="mt-2 w-32 h-32 object-cover rounded-md border"
              />
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Observação</Label>
          <Textarea
            value={form.observation}
            onChange={(e) => set('observation', e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-bold text-lg">Itens do Serviço</h2>
        {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
        <ServiceOrderItems items={items} onChange={setItems} />
      </div>

      <Button type="submit" disabled={saving} className="w-full" size="lg">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
      </Button>
    </form>
  )
}
