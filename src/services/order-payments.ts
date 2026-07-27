import pb from '@/lib/pocketbase/client'
import type { PaymentMethod } from './service-orders'
import type { CardFlag } from './card-rates'

export type OrderPayment = {
  id: string
  order_id: string | null
  method: PaymentMethod | ''
  amount: number
  card_flag: CardFlag | ''
  installments: number
  applied_rate: number | null
  fee_amount: number | null
  created: string
  updated: string
}

export type PaymentLine = {
  id: string
  method: PaymentMethod | ''
  amount: number
  card_flag: CardFlag | ''
  installments: number
  applied_rate: number
  fee_amount: number
}

export const buildPaymentData = (params: {
  method: string
  amount: number
  card_flag?: string
  installments?: number
  applied_rate: number
  fee_amount: number
  order_id?: string | null
  venda_avulsa_id?: string | null
}) => {
  const isCardPayment =
    params.method === 'Cartão de Crédito' || params.method === 'Cartão de Débito'
  return {
    order_id: params.order_id ?? null,
    venda_avulsa_id: params.venda_avulsa_id ?? null,
    method: params.method,
    amount: Number(params.amount) || 0,
    card_flag: isCardPayment && params.card_flag ? params.card_flag : null,
    installments: isCardPayment ? params.installments || 1 : null,
    applied_rate: Number(params.applied_rate) || 0,
    fee_amount: Number(params.fee_amount) || 0,
  }
}

export const getOrderPayments = (orderId: string) =>
  pb.collection('order_payments').getFullList<OrderPayment>({
    filter: `order_id = "${orderId}"`,
    sort: 'created',
  })

export const createOrderPayment = (data: Record<string, unknown>) =>
  pb.collection('order_payments').create<OrderPayment>(data)

export const deleteOrderPayment = (id: string) => pb.collection('order_payments').delete(id)
