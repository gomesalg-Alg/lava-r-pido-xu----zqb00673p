import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceOrderForm } from '@/components/admin/ServiceOrderForm'
import { generateServiceOrderPdf } from '@/lib/service-order-pdf'
import { toast } from 'sonner'

export default function EditServiceOrder() {
  const { id } = useParams<{ id: string }>()

  const handlePrint = async () => {
    if (!id) return
    try {
      await generateServiceOrderPdf(id)
    } catch {
      toast.error('Erro ao gerar PDF da ordem de serviço')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/admin/ordem-servico">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Link>
        </Button>
        {id && (
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Gerar PDF
          </Button>
        )}
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Ordem de Serviço</h1>
      <ServiceOrderForm orderId={id} />
    </div>
  )
}
