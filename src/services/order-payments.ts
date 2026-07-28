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

  const rawAmount = Number(params.amount)
  const amount = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) / 100 : 0

  const data: Record<string, unknown> = {
    method: params.method ? params.method.trim() : '',
    amount: amount,
  }

  if (params.order_id && typeof params.order_id === 'string' && params.order_id.trim() !== '') {
    data.order_id = params.order_id.trim()
  }

  if (
    params.venda_avulsa_id &&
    typeof params.venda_avulsa_id === 'string' &&
    params.venda_avulsa_id.trim() !== ''
  ) {
    data.venda_avulsa_id = params.venda_avulsa_id.trim()
  }

  if (isCardPayment) {
    if (params.card_flag && params.card_flag.trim() !== '') {
      data.card_flag = params.card_flag.trim()
    }
    data.installments =
      params.installments && params.installments > 0 ? Math.round(params.installments) : 1

    const rate = Number(params.applied_rate)
    data.applied_rate = Number.isFinite(rate) ? Math.round(rate * 10000) / 10000 : 0

    const fee = Number(params.fee_amount)
    data.fee_amount = Number.isFinite(fee) ? Math.round(fee * 100) / 100 : 0
  }

  return data
}

export const getOrderPayments = (orderId: string) =>
  pb.collection('order_payments').getFullList<OrderPayment>({
    filter: `order_id = "${orderId}"`,
    sort: 'created',
  })

export const sanitizePaymentData = (data: Record<string, unknown>): Record<string, unknown> => {
  // Step 1: Remove null, undefined, empty string "", or NaN values
  let cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => {
      if (v === null || v === undefined || v === '') return false
      if (typeof v === 'number' && isNaN(v)) return false
      return true
    }),
  )

  // Step 2: Conditionally keep/remove card-specific fields based on method
  const method = cleaned.method as string | undefined
  const isCardPayment = method === 'Cartão de Crédito' || method === 'Cartão de Débito'

  const cardFields = ['card_flag', 'installments', 'applied_rate', 'fee_amount'] as const

  if (!isCardPayment) {
    for (const f of cardFields) {
      delete cleaned[f]
    }
  } else {
    for (const f of cardFields) {
      const val = cleaned[f]
      if (val === null || val === undefined || val === '') {
        delete cleaned[f]
      }
    }
  }

  if (typeof cleaned.amount === 'number') {
    cleaned.amount = Math.round(cleaned.amount * 100) / 100
  } else if (typeof cleaned.amount === 'string') {
    cleaned.amount = Math.round(parseFloat(cleaned.amount) * 100) / 100
  }

  if (typeof cleaned.fee_amount === 'number') {
    cleaned.fee_amount = Math.round(cleaned.fee_amount * 100) / 100
  }

  if (typeof cleaned.applied_rate === 'number') {
    cleaned.applied_rate = Math.round(cleaned.applied_rate * 10000) / 10000
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
