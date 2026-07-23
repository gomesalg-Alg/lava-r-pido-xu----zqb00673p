import { sanitizePhone, buildWhatsAppShareUrl } from './whatsapp-share'
import { formatCurrency, formatDateBR } from './format'

export { sanitizePhone, buildWhatsAppShareUrl }

export interface ReceiptMessageParams {
  customerName: string
  ticketNumber: number | string | null
  totalAmount: number
  amountPaid: number
  troco: number
  paymentMethod: string
  cardFlag?: string
  emissionDate: string
  companyName: string
}

export function buildReceiptMessage(params: ReceiptMessageParams): string {
  const {
    customerName,
    ticketNumber,
    totalAmount,
    amountPaid,
    troco,
    paymentMethod,
    cardFlag,
    emissionDate,
    companyName,
  } = params

  const lines: string[] = []
  lines.push(`*RECIBO - ${companyName}*`)
  lines.push('')
  lines.push(`Olá ${customerName}!`)
  lines.push('')
  if (ticketNumber !== null && ticketNumber !== undefined) {
    lines.push(`OS Nº: ${String(ticketNumber).padStart(4, '0')}`)
  }
  lines.push(`Data de Emissão: ${formatDateBR(emissionDate)}`)
  lines.push('')
  lines.push('*Resumo Financeiro:*')
  lines.push(`Total: ${formatCurrency(totalAmount)}`)
  let paymentLabel = paymentMethod || 'Não informado'
  if (cardFlag) paymentLabel += ` - ${cardFlag}`
  lines.push(`Forma de Pagamento: ${paymentLabel}`)
  lines.push(`Valor Pago: ${formatCurrency(amountPaid)}`)
  if (troco > 0) {
    lines.push(`Troco: ${formatCurrency(troco)}`)
  }
  lines.push('')
  lines.push('Obrigado pela preferência! 🚗✨')

  return lines.join('\n')
}
