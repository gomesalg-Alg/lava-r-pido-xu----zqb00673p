import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceOrderForm } from '@/components/admin/ServiceOrderForm'

export default function EditServiceOrder() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/admin/ordem-servico">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Ordem de Serviço</h1>
      <ServiceOrderForm orderId={id} />
    </div>
  )
}
