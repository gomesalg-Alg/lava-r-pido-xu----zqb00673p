import { useEffect, useState, useRef } from 'react'
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
import { Save, ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react'

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
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingLogo, setExistingLogo] = useState('')
  const [logoDeleted, setLogoDeleted] = useState(false)
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
          setExistingLogo(c.logo || '')
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

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoDeleted(false)
    }
  }

  const handleDeleteLogo = () => {
    setLogoFile(null)
    setExistingLogo('')
    setLogoDeleted(true)
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
      const payload: Record<string, unknown> = { ...form }
      if (logoFile) payload.logo = logoFile
      else if (logoDeleted) payload.logo = null

      if (company) {
        await updateCompany(company.id, payload)
        toast.success('Dados da empresa atualizados com sucesso!')
      } else {
        const created = await createCompany(payload)
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

  const logoUrl = logoFile
    ? URL.createObjectURL(logoFile)
    : existingLogo && !logoDeleted && company
      ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company/${company.id}/${existingLogo}`
      : ''

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
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Logo da Empresa"
                      className="w-24 h-24 object-contain rounded-lg border bg-white p-2"
                    />
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogo}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {existingLogo && !logoDeleted ? 'Trocar Logo' : 'Enviar Logo'}
                </Button>
              </div>
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
