import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSupplier, updateSupplier, type Supplier } from '@/services/suppliers'
import {
  maskCPF,
  maskCNPJAlphanumeric,
  maskPhone,
  maskCEP,
  validateCPF,
  validateCNPJAlphanumeric,
} from '@/lib/masks'
import { fetchCep } from '@/lib/cep'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { useFormKeyboard } from '@/hooks/use-form-keyboard'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

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

interface SupplierFormProps {
  initialSupplier?: Supplier | null
}

export function SupplierForm({ initialSupplier }: SupplierFormProps) {
  const navigate = useNavigate()
  const isEditMode = !!initialSupplier
  const keyboardRef = useFormKeyboard<HTMLFormElement>()

  const [form, setForm] = useState({
    name: initialSupplier?.name || '',
    tipo_pessoa: (initialSupplier?.tipo_pessoa as 'F' | 'J') || 'J',
    cpf: initialSupplier?.cpf || '',
    cnpj: initialSupplier?.cnpj || '',
    phone: initialSupplier?.phone || '',
    email: initialSupplier?.email || '',
    address: initialSupplier?.address || '',
    cep: initialSupplier?.cep || '',
    complement: initialSupplier?.complement || '',
    neighborhood: initialSupplier?.neighborhood || '',
    city: initialSupplier?.city || '',
    state: initialSupplier?.state || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => {
      const n = { ...p }
      delete n[k]
      return n
    })
  }

  const handleTipoPessoaChange = (value: string) => {
    setForm((p) => ({
      ...p,
      tipo_pessoa: value as 'F' | 'J',
      cpf: value === 'F' ? p.cpf : '',
      cnpj: value === 'J' ? p.cnpj : '',
    }))
    setErrors((p) => {
      const n = { ...p }
      delete n.cpf
      delete n.cnpj
      delete n.tipo_pessoa
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
    if (!form.tipo_pessoa) e.tipo_pessoa = 'Obrigatório'
    if (form.tipo_pessoa === 'F') {
      if (!form.cpf.trim()) e.cpf = 'Obrigatório'
      else if (!validateCPF(form.cpf)) e.cpf = 'CPF inválido'
    } else if (form.tipo_pessoa === 'J') {
      if (!form.cnpj.trim()) e.cnpj = 'Obrigatório'
      else if (!validateCNPJAlphanumeric(form.cnpj)) e.cnpj = 'CNPJ inválido'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido'
    if (form.cep && form.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP inválido'
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
      const payload = {
        ...form,
        cpf: form.tipo_pessoa === 'F' ? form.cpf : '',
        cnpj: form.tipo_pessoa === 'J' ? form.cnpj : '',
      }
      if (isEditMode && initialSupplier) {
        await updateSupplier(initialSupplier.id, payload)
        toast.success('Fornecedor atualizado com sucesso!')
      } else {
        await createSupplier(payload)
        toast.success('Fornecedor cadastrado com sucesso!')
      }
      navigate('/admin/fornecedores')
    } catch (err) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        setErrors((p) => ({ ...p, ...fieldErrs }))
        toast.error('Verifique os campos do formulário')
      } else {
        toast.error(isEditMode ? 'Erro ao atualizar fornecedor' : 'Erro ao cadastrar fornecedor')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={keyboardRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-bold text-lg mb-4">Dados do Fornecedor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo de Pessoa *</Label>
            <Select value={form.tipo_pessoa} onValueChange={handleTipoPessoaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="F">Física</SelectItem>
                <SelectItem value="J">Jurídica</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo_pessoa && <p className="text-xs text-red-500">{errors.tipo_pessoa}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          {form.tipo_pessoa === 'F' && (
            <div className="space-y-1.5">
              <Label>CPF *</Label>
              <Input value={form.cpf} onChange={(e) => set('cpf', maskCPF(e.target.value))} />
              {errors.cpf && <p className="text-xs text-red-500">{errors.cpf}</p>}
            </div>
          )}
          {form.tipo_pessoa === 'J' && (
            <div className="space-y-1.5">
              <Label>CNPJ *</Label>
              <Input
                value={form.cnpj}
                onChange={(e) => set('cnpj', maskCNPJAlphanumeric(e.target.value))}
                maxLength={18}
              />
              {errors.cnpj && <p className="text-xs text-red-500">{errors.cnpj}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-bold text-lg mb-4">Endereço</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>CEP</Label>
            <Input value={form.cep} onChange={(e) => handleCep(e.target.value)} />
            {errors.cep && <p className="text-xs text-red-500">{errors.cep}</p>}
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
      <Button type="submit" disabled={saving} className="w-full" size="lg">
        <Save className="w-4 h-4 mr-2" />{' '}
        {saving ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
      </Button>
    </form>
  )
}
