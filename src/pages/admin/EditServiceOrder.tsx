import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceOrderForm } from '@/components/admin/ServiceOrderForm'
import { WhatsAppShareButton } from '@/components/admin/WhatsAppShareButton'
import { generateServiceOrderPdf } from '@/lib/service-order-pdf'
import { getServiceOrder, type ServiceOrder } from '@/services/service-orders'
import { getCompany, type Company } from '@/services/company'
import { toast } from 'sonner'

export default function EditServiceOrder() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [company, setCompany] = useState<Company | null>(null)

  useEffect(() => {
    if (!id) return
    getServiceOrder(id)
      .then(setOrder)
      .catch(() => {})
    getCompany()
      .then(setCompany)
      .catch(() => {})
  }, [id])

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
        <div className="flex gap-2">
          {id && order && (
            <WhatsAppShareButton
              customerName={order.expand?.customer_id?.name || 'Cliente'}
              customerPhone={order.expand?.customer_id?.phone || ''}
              ticketNumber={order.ticket_number}
              companyName={company?.trading_name || company?.name || 'Lava Rápido XUÁ'}
              orderId={id}
            />
          )}
          {id && (
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Gerar PDF
            </Button>
          )}
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Ordem de Serviço</h1>
      <ServiceOrderForm orderId={id} />
    </div>
  )
}
