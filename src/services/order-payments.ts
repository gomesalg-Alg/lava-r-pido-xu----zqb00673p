import pb from '@/lib/pocketbase/client'
import { ClientResponseError } from 'pocketbase'
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
  const data: Record<string, unknown> = {
    method: params.method,
    amount: Number(params.amount) || 0,
  }
  if (params.order_id) data.order_id = params.order_id
  if (params.venda_avulsa_id) data.venda_avulsa_id = params.venda_avulsa_id
  if (isCardPayment) {
    if (params.card_flag) data.card_flag = params.card_flag
    data.installments = params.installments || 1
    const rate = Number(params.applied_rate)
    data.applied_rate = Number.isFinite(rate) ? rate : 0
    const fee = Number(params.fee_amount)
    data.fee_amount = Number.isFinite(fee) ? fee : 0
  }
  return data
}

export const getOrderPayments = (orderId: string) =>
  pb.collection('order_payments').getFullList<OrderPayment>({
    filter: `order_id = "${orderId}"`,
    sort: 'created',
  })

export const createOrderPayment = async (data: Record<string, unknown>) => {
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== null && v !== undefined),
  )
  try {
    return await pb.collection('order_payments').create<OrderPayment>(cleaned)
  } catch (error) {
    if (error instanceof ClientResponseError) {
      console.error('[createOrderPayment] PocketBase error:', {
        status: error.status,
        message: error.message,
        responseData: error.response,
        fieldErrors: error.response?.data,
        requestData: cleaned,
      })
    } else {
      console.error('[createOrderPayment] Unexpected error:', error, {
        requestData: cleaned,
      })
    }
    throw error
  }
}

export const deleteOrderPayment = (id: string) => pb.collection('order_payments').delete(id)
