import pb from '@/lib/pocketbase/client'
import type { PaymentMethod } from './service-orders'
import type { CardFlag } from './card-rates'

export type OrderPayment = {
  id: string
  order_id: string
  method: PaymentMethod | ''
  amount: number
  card_flag: CardFlag | ''
  installments: number
  created: string
  updated: string
}

export type PaymentLine = {
  id: string
  method: PaymentMethod | ''
  amount: number
  card_flag: CardFlag | ''
  installments: number
}

export const getOrderPayments = (orderId: string) =>
  pb.collection('order_payments').getFullList<OrderPayment>({
    filter: `order_id = "${orderId}"`,
    sort: 'created',
  })

export const createOrderPayment = (data: Record<string, unknown>) =>
  pb.collection('order_payments').create<OrderPayment>(data)

export const deleteOrderPayment = (id: string) => pb.collection('order_payments').delete(id)
