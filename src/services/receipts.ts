import pb from '@/lib/pocketbase/client'

export interface PublicReceiptItem {
  name: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount: number
  surcharge_amount: number
}

export interface PublicReceiptData {
  id: string
  amount: number
  status: string
  description: string
  payment_method: string
  received_at: string
  created: string
  customer: { name: string; phone: string; cpf: string } | null
  order: {
    ticket_number: number
    total_discount: number
    total_surcharge: number
    amount_paid: number
  } | null
  venda_avulsa: {
    items: PublicReceiptItem[]
    total_amount: number
    payment_method: string
    change_amount: number
  } | null
  payments: Array<{
    method: string
    amount: number
    card_flag: string
    installments: number
  }>
  items: PublicReceiptItem[]
  company: {
    id: string
    name: string
    trading_name: string
    phone: string
    address: string
    number: string
    city: string
    state: string
    logo: string
  } | null
}

export const getPublicReceipt = (id: string) =>
  pb.send(`/backend/v1/public/recibo/${id}`, { method: 'GET' }) as Promise<PublicReceiptData>
