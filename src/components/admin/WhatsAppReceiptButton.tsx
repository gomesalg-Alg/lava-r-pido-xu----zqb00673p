import { useState } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sanitizePhone, buildWhatsAppShareUrl, buildReceiptMessage } from '@/lib/whatsapp-receipt'
import { getOrderPayments } from '@/services/order-payments'
import { toast } from 'sonner'

interface Props {
  customerName: string
  customerPhone: string
  ticketNumber: number | string | null
  totalAmount: number
  amountPaid: number
  paymentMethod: string
  emissionDate: string
  companyName: string
  orderId?: string | null
  className?: string
}

export function WhatsAppReceiptButton({
  customerName,
  customerPhone,
  ticketNumber,
  totalAmount,
  amountPaid,
  paymentMethod,
  emissionDate,
  companyName,
  orderId,
  className,
}: Props) {
  const [loading, setLoading] = useState(false)

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

  const handleClick = async () => {
    setLoading(true)
    try {
      let cardFlag = ''
      let totalPaid = amountPaid

      if (orderId) {
        const payments = await getOrderPayments(orderId)
        if (payments.length > 0) {
          totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)
          const cardPayment = payments.find((p) => p.card_flag)
          if (cardPayment) cardFlag = cardPayment.card_flag
        }
      }

      const troco = totalPaid - totalAmount

      const message = buildReceiptMessage({
        customerName,
        ticketNumber,
        totalAmount,
        amountPaid: totalPaid,
        troco: troco > 0 ? troco : 0,
        paymentMethod,
        cardFlag: cardFlag || undefined,
        emissionDate,
        companyName,
      })

      const waUrl = buildWhatsAppShareUrl(customerPhone, message)
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Erro ao gerar recibo para WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={buttonClass}
      title="Enviar recibo por WhatsApp"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
    </Button>
  )
}
