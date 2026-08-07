import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  sanitizePhone,
  buildWhatsAppShareUrl,
  buildVendaAvulsaShareMessage,
} from '@/lib/whatsapp-share'

interface Props {
  customerName: string
  customerPhone: string
  hasWhatsApp: boolean
  amount: number
  companyName: string
  paymentMethod?: string
  className?: string
}

export function WhatsAppVendaAvulsaButton({
  customerName,
  customerPhone,
  hasWhatsApp,
  amount,
  companyName,
  paymentMethod,
  className,
}: Props) {
  const cleanPhone = sanitizePhone(customerPhone)

  if (!cleanPhone || !hasWhatsApp) {
    return null
  }

  const message = buildVendaAvulsaShareMessage(customerName, amount, companyName, paymentMethod)
  const waUrl = buildWhatsAppShareUrl(customerPhone, message)

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className={cn(
        'text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200',
        className,
      )}
      title="Enviar venda por WhatsApp"
    >
      <a href={waUrl} target="_blank" rel="noreferrer">
        <MessageCircle className="w-4 h-4" />
      </a>
    </Button>
  )
}
