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
    data.installments = params.installments && params.installments > 0 ? params.installments : 1
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

export const sanitizePaymentData = (data: Record<string, unknown>): Record<string, unknown> => {
  // Step 1: Remove null, undefined, and empty string values
  let cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  )

  // Step 2: Conditionally keep/remove card-specific fields based on method
  const method = cleaned.method as string | undefined
  const isCardPayment = method === 'Cartão de Crédito' || method === 'Cartão de Débito'

  const cardFields = ['card_flag', 'installments', 'applied_rate', 'fee_amount'] as const

  if (!isCardPayment) {
    // Remove all card-specific fields when method is not a card payment
    for (const f of cardFields) {
      delete cleaned[f]
    }
  } else {
    // For card payments: keep card_flag and installments if provided;
    // keep applied_rate and fee_amount only if present and non-null
    for (const f of cardFields) {
      const val = cleaned[f]
      if (val === null || val === undefined || val === '') {
        delete cleaned[f]
      }
    }
  }

  return cleaned
}

export const createOrderPayment = async (data: Record<string, unknown>) => {
  const cleaned = sanitizePaymentData(data)
  try {
    return await pb.collection('order_payments').create<OrderPayment>(cleaned)
  } catch (error) {
    if (error instanceof ClientResponseError) {
      const fieldErrors = error.response?.data
      console.error(
        '[createOrderPayment] PocketBase error:\n' +
          `  status: ${error.status}\n` +
          `  message: ${error.message}\n` +
          `  rawResponse: ${JSON.stringify(error.response, null, 2)}\n` +
          `  responseData: ${JSON.stringify(error.response?.data, null, 2)}\n` +
          `  fieldErrors: ${JSON.stringify(fieldErrors, null, 2)}\n` +
          `  requestData: ${JSON.stringify(cleaned, null, 2)}`,
      )
    } else {
      console.error(
        '[createOrderPayment] Unexpected error:\n' +
          `  error: ${error}\n` +
          `  errorString: ${String(error)}\n` +
          `  requestData: ${JSON.stringify(cleaned, null, 2)}`,
      )
    }
    throw error
  }
}

export const deleteOrderPayment = (id: string) => pb.collection('order_payments').delete(id)
