export function sanitizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length <= 11) return '55' + digits
  return digits
}

export function buildOrderShareMessage(
  customerName: string,
  ticketNumber: number | string,
  companyName: string,
  osUrl: string,
): string {
  const ticket = String(ticketNumber).padStart(4, '0')
  return `Olá ${customerName}, aqui está o recibo da sua Ordem de Serviço nº ${ticket} na ${companyName}. Você pode visualizar os detalhes aqui: ${osUrl}`
}

export function buildWhatsAppShareUrl(phone: string, message: string): string {
  const cleanPhone = sanitizePhone(phone)
  if (!cleanPhone) return ''
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function buildPublicOsUrl(orderId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/os/${orderId}`
}
