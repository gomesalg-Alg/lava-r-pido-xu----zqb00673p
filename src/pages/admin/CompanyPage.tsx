import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCompanyById, updateCompany, createCompany, type Company } from '@/services/company'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { maskCEP, maskPhone } from '@/lib/masks'
import { fetchCep } from '@/lib/cep'
import { toast } from 'sonner'
import { Save, ArrowLeft } from 'lucide-react'

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

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    trading_name: '',
    cnpj: '',
    phone: '',
    home_page: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false)
        return
      }
      try {
        const c = await getCompanyById(id)
        setCompany(c)
        if (c) {
          setForm({
            name: c.name || '',
            trading_name: c.trading_name || '',
            cnpj: c.cnpj || '',
            phone: c.phone || '',
            home_page: c.home_page || '',
            cep: c.cep || '',
            address: c.address || '',
            number: c.number || '',
            complement: c.complement || '',
            neighborhood: c.neighborhood || '',
            city: c.city || '',
            state: c.state || '',
          })
        }
      } catch {
        toast.error('Erro ao carregar dados da empresa')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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
    if (form.home_page && !/^https?:\/\/[^\s@]+(\.[^\s@]+)+([/?#].*)?$/i.test(form.home_page)) {
      e.home_page = 'URL inválida (ex: https://www.exemplo.com.br)'
    }
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Verifique os campos do formulário')
      return
    }
    setSaving(true)
    try {
      if (company) {
        await updateCompany(company.id, form)
        toast.success('Dados da empresa atualizados com sucesso!')
      } else {
        const created = await createCompany(form)
        setCompany(created)
        toast.success('Empresa cadastrada com sucesso!')
      }
    } catch {
      toast.error('Erro ao salvar dados da empresa')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-center py-8 text-slate-400">Carregando...</p>

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/admin/empresa">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {company ? 'Editar Empresa' : 'Nova Empresa'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-bold text-lg">Dados da Empresa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Razão Social *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nome Fantasia</Label>
              <Input
                value={form.trading_name}
                onChange={(e) => set('trading_name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Home Page</Label>
              <Input
                type="url"
                placeholder="https://www.exemplo.com.br"
                value={form.home_page}
                onChange={(e) => set('home_page', e.target.value)}
              />
              {errors.home_page && <p className="text-xs text-red-500">{errors.home_page}</p>}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-bold text-lg">Endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input value={form.cep} onChange={(e) => handleCep(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Número</Label>
              <Input value={form.number} onChange={(e) => set('number', e.target.value)} />
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
        <Button type="submit" disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </div>
  )
}
