import { useEffect, useState } from 'react'
import { getCompany, saveCompany } from '@/services/company'
import { fetchCep } from '@/lib/cep'
import { maskCEP, maskPhone } from '@/lib/masks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Save, Building2 } from 'lucide-react'

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

const emptyForm = {
  name: '',
  trading_name: '',
  cnpj: '',
  phone: '',
  email: '',
  cep: '',
  address: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}

export default function CompanyPage() {
  const [id, setId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCompany()
      .then((c) => {
        if (c) {
          setId(c.id)
          setForm({ ...emptyForm, ...c })
        }
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleCep = async (cep: string) => {
    const masked = maskCEP(cep)
    set('cep', masked)
    if (masked.replace(/\D/g, '').length === 8) {
      const data = await fetchCep(masked)
      if (data) {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await saveCompany(id, form)
      toast.success(id ? 'Dados atualizados!' : 'Empresa cadastrada!')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-slate-400">Carregando...</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="text-primary" size={28} />
        <h1 className="text-2xl font-bold text-slate-800">Dados da Empresa</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg">Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Razão Social *" value={form.name} onChange={(v) => set('name', v)} />
              <Field
                label="Nome Fantasia"
                value={form.trading_name}
                onChange={(v) => set('trading_name', v)}
              />
              <Field label="CNPJ" value={form.cnpj} onChange={(v) => set('cnpj', v)} />
              <Field
                label="Telefone"
                value={form.phone}
                onChange={(v) => set('phone', maskPhone(v))}
              />
              <Field
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(v) => set('email', v)}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg">Endereço</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="CEP" value={form.cep} onChange={handleCep} />
              <Field label="Número" value={form.number} onChange={(v) => set('number', v)} />
              <div className="sm:col-span-2">
                <Field label="Endereço" value={form.address} onChange={(v) => set('address', v)} />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Complemento"
                  value={form.complement}
                  onChange={(v) => set('complement', v)}
                />
              </div>
              <Field
                label="Bairro"
                value={form.neighborhood}
                onChange={(v) => set('neighborhood', v)}
              />
              <Field label="Cidade" value={form.city} onChange={(v) => set('city', v)} />
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
          </CardContent>
        </Card>
        <Button type="submit" disabled={saving} size="lg" className="w-full">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Dados'}
        </Button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
