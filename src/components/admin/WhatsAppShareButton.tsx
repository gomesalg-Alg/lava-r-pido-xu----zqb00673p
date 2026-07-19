import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  sanitizePhone,
  buildOrderShareMessage,
  buildWhatsAppShareUrl,
  buildPublicOsUrl,
} from '@/lib/whatsapp-share'

interface Props {
  customerName: string
  customerPhone: string
  ticketNumber: number | string
  companyName: string
  orderId: string
  showLabel?: boolean
  className?: string
}

export function WhatsAppShareButton({
  customerName,
  customerPhone,
  ticketNumber,
  companyName,
  orderId,
  showLabel = true,
  className,
}: Props) {
  const cleanPhone = sanitizePhone(customerPhone)
  const buttonClass = cn(
    'text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200',
    className,
  )

  const content = (
    <>
      <MessageCircle className="w-4 h-4" />
      {showLabel && <span className="ml-2">Enviar via WhatsApp</span>}
    </>
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
        {content}
      </Button>
    )
  }

  const osUrl = buildPublicOsUrl(orderId)
  const message = buildOrderShareMessage(customerName, ticketNumber, companyName, osUrl)
  const waUrl = buildWhatsAppShareUrl(customerPhone, message)

  return (
    <Button variant="outline" size="sm" asChild className={buttonClass} title="Enviar por WhatsApp">
      <a href={waUrl} target="_blank" rel="noreferrer">
        {content}
      </a>
    </Button>
  )
}
