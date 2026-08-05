import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sanitizePhone, buildWhatsAppShareUrl } from '@/lib/whatsapp-share'
import { formatCurrency } from '@/lib/format'

interface Props {
  customerName: string
  customerPhone: string
  receiptId: string
  description?: string
  amount?: number
  className?: string
  showLabel?: boolean
}

export function WhatsAppReceiptButton({
  customerName,
  customerPhone,
  receiptId,
  description,
  amount,
  className,
  showLabel,
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

  const publicUrl = 'https://www.lavarapidoxua.com.br'
  const receiptUrl = `${publicUrl}/recibo/${receiptId}`
  const descText = description || 'pagamento'
  const amountText = amount != null ? formatCurrency(amount) : ''
  const message = `Olá ${customerName}, segue o comprovante do seu pagamento referente a ${descText} no valor de ${amountText} na Lava Rápido Xua. Você pode visualizar o recibo completo aqui: ${receiptUrl}`
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
        {showLabel && <span className="ml-2">WhatsApp</span>}
      </a>
    </Button>
  )
}
