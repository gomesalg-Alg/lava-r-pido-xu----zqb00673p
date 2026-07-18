import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/admin/CustomerForm'
import { getCustomer, type Customer } from '@/services/customers'
import { getVehiclesByCustomer, type Vehicle } from '@/services/vehicles'
import { toast } from 'sonner'

export default function EditCustomer() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const c = await getCustomer(id)
        setCustomer(c)
        const v = await getVehiclesByCustomer(id)
        setVehicles(v)
      } catch {
        toast.error('Erro ao carregar cliente')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <p className="text-center py-8 text-slate-400">Carregando...</p>
  if (!customer) return <p className="text-center py-8 text-slate-400">Cliente não encontrado.</p>

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/admin/clientes">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Cliente</h1>
      <CustomerForm initialCustomer={customer} initialVehicles={vehicles} />
    </div>
  )
}
