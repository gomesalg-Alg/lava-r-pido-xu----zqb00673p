import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sanitizePhone, buildWhatsAppShareUrl } from '@/lib/whatsapp-share'

interface Props {
  customerName: string
  customerPhone: string
  receiptId: string
  className?: string
}

export function WhatsAppReceiptButton({
  customerName,
  customerPhone,
  receiptId,
  className,
}: Props) {
  const cleanPhone = sanitizePhone(customerPhone)

  const buttonClass = cn(
    'text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200',
    className,
  )

  if (!cleanPhone) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={buttonClass}
        title="Cliente sem telefone cadastrado"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    )
  }

  const receiptUrl = `${window.location.origin}/recibo/${receiptId}`
  const message = `Olá ${customerName}! Sua nota de serviço está disponível aqui: ${receiptUrl}`
  const waUrl = buildWhatsAppShareUrl(customerPhone, message)

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className={buttonClass}
      title="Enviar recibo por WhatsApp"
    >
      <a href={waUrl} target="_blank" rel="noreferrer">
        <MessageCircle className="w-4 h-4" />
      </a>
    </Button>
  )
}
