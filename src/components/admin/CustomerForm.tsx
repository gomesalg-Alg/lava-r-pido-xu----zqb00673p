import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VehicleGrid, type VehicleRow } from './VehicleGrid'
import { createCustomer, updateCustomer, type Customer } from '@/services/customers'
import { createVehicle, updateVehicle, deleteVehicle, type Vehicle } from '@/services/vehicles'
import { maskCPF, maskPhone, maskCEP, validateCPF } from '@/lib/masks'
import { fetchCep } from '@/lib/cep'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

interface CustomerFormProps {
  initialCustomer?: Customer | null
  initialVehicles?: Vehicle[]
}

export function CustomerForm({ initialCustomer, initialVehicles }: CustomerFormProps) {
  const navigate = useNavigate()
  const isEditMode = !!initialCustomer
  const existingVehicleIds = useRef<string[]>(initialVehicles?.map((v) => v.id) || [])

  const [form, setForm] = useState({
    name: initialCustomer?.name || '',
    social_name: initialCustomer?.social_name || '',
    birth_date: initialCustomer?.birth_date
      ? initialCustomer.birth_date.split(' ')[0].split('T')[0]
      : '',
    cpf: initialCustomer?.cpf || '',
    phone: initialCustomer?.phone || '',
    has_whatsapp: initialCustomer?.has_whatsapp || false,
    email: initialCustomer?.email || '',
    cep: initialCustomer?.cep || '',
    address: initialCustomer?.address || '',
    complement: initialCustomer?.complement || '',
    neighborhood: initialCustomer?.neighborhood || '',
    city: initialCustomer?.city || '',
    state: initialCustomer?.state || '',
  })
  const [vehicles, setVehicles] = useState<VehicleRow[]>(
    initialVehicles?.map((v) => ({
      id: v.id,
      type: v.type,
      brand: v.brand,
      model: v.model,
      year: v.year?.toString() || '',
      fuel: v.fuel || '',
      placa: v.placa || '',
    })) || [],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [vehicleErrors, setVehicleErrors] = useState<Record<number, Record<string, string>>>({})
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: unknown) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => {
      const n = { ...p }
      delete n[k]
      return n
    })
  }

  const handleCep = async (cep: string) => {
    const masked = maskCEP(cep)
    set('cep', masked)
    if (masked.replace(/\D/g, '').length === 8) {
      const data = await fetchCep(masked)
      if (data)
        setForm((p) => ({
          ...p,
          address: data.logradouro,
          complement: data.complemento,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }))
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Obrigatório'
    if (!form.cpf.trim()) e.cpf = 'Obrigatório'
    else if (!validateCPF(form.cpf)) e.cpf = 'CPF inválido'
    if (!form.phone.trim()) e.phone = 'Obrigatório'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido'
    const ve: Record<number, Record<string, string>> = {}
    vehicles.forEach((v, i) => {
      const errs: Record<string, string> = {}
      if (!v.type) errs.type = 'Obrigatório'
      if (!v.brand.trim()) errs.brand = 'Obrigatório'
      if (!v.model.trim()) errs.model = 'Obrigatório'
      if (Object.keys(errs).length) ve[i] = errs
    })
    setErrors(e)
    setVehicleErrors(ve)
    return !Object.keys(e).length && !Object.keys(ve).length
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) {
      toast.error('Verifique os campos do formulário')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, birth_date: form.birth_date || null }
      if (isEditMode && initialCustomer) {
        await updateCustomer(initialCustomer.id, payload)
        const currentIds = vehicles.map((v) => v.id)
        for (const oldId of existingVehicleIds.current) {
          if (!currentIds.includes(oldId)) await deleteVehicle(oldId)
        }
        for (const v of vehicles) {
          const vd = {
            type: v.type,
            brand: v.brand,
            model: v.model,
            year: v.year ? parseInt(v.year) : null,
            fuel: v.fuel,
            placa: v.placa,
          }
          if (existingVehicleIds.current.includes(v.id)) {
            await updateVehicle(v.id, vd)
          } else {
            await createVehicle({ customer_id: initialCustomer.id, ...vd })
          }
        }
        toast.success('Cliente atualizado com sucesso!')
        navigate('/admin/clientes')
      } else {
        const customer = await createCustomer(payload)
        for (const v of vehicles) {
          await createVehicle({
            customer_id: customer.id,
            type: v.type,
            brand: v.brand,
            model: v.model,
            year: v.year ? parseInt(v.year) : null,
            fuel: v.fuel,
            placa: v.placa,
          })
        }
        toast.success('Cliente cadastrado com sucesso!')
        navigate('/admin/clientes')
      }
    } catch {
      toast.error(isEditMode ? 'Erro ao atualizar cliente' : 'Erro ao cadastrar cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-bold text-lg mb-4">Dados Pessoais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nome Social</Label>
            <Input value={form.social_name} onChange={(e) => set('social_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de Nascimento</Label>
            <Input
              type="date"
              value={form.birth_date}
              onChange={(e) => set('birth_date', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>CPF *</Label>
            <Input value={form.cpf} onChange={(e) => set('cpf', maskCPF(e.target.value))} />
            {errors.cpf && <p className="text-xs text-red-500">{errors.cpf}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Telefone *</Label>
            <Input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={form.has_whatsapp} onCheckedChange={(v) => set('has_whatsapp', v)} />
            <Label>Possui WhatsApp?</Label>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-bold text-lg mb-4">Endereço</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>CEP</Label>
            <Input value={form.cep} onChange={(e) => handleCep(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Complemento</Label>
            <Input value={form.complement} onChange={(e) => set('complement', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Bairro</Label>
            <Input
              value={form.neighborhood}
              onChange={(e) => set('neighborhood', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>UF</Label>
            <Select value={form.state} onValueChange={(v) => set('state', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-bold text-lg mb-4">Veículos</h2>
        <VehicleGrid vehicles={vehicles} onChange={setVehicles} errors={vehicleErrors} />
      </div>
      <Button type="submit" disabled={saving} className="w-full" size="lg">
        <Save className="w-4 h-4 mr-2" />{' '}
        {saving ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Cadastrar Cliente'}
      </Button>
    </form>
  )
}
