import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SupplierForm } from '@/components/admin/SupplierForm'
import { getSupplier, type Supplier } from '@/services/suppliers'
import { toast } from 'sonner'

export default function EditSupplier() {
  const { id } = useParams<{ id: string }>()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const s = await getSupplier(id)
        setSupplier(s)
      } catch {
        toast.error('Erro ao carregar fornecedor')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <p className="text-center py-8 text-slate-400">Carregando...</p>
  if (!supplier)
    return <p className="text-center py-8 text-slate-400">Fornecedor não encontrado.</p>

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/admin/fornecedores">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Fornecedor</h1>
      <SupplierForm initialSupplier={supplier} />
    </div>
  )
}
