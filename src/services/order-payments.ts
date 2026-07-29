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

export const getOrderPaymentsByVendaAvulsa = (vendaAvulsaId: string) =>
  pb.collection('order_payments').getFullList<OrderPayment>({
    filter: `venda_avulsa_id = "${vendaAvulsaId}"`,
    sort: 'created',
  })

export const sanitizePaymentData = (data: Record<string, unknown>): Record<string, unknown> => {
  const method = typeof data.method === 'string' ? data.method.trim() : ''
  const isCardPayment = method === 'Cartão de Crédito' || method === 'Cartão de Débito'

  const cleaned: Record<string, unknown> = {}

  // Required: method (must be a non-empty string matching a select value)
  if (method) {
    cleaned.method = method
  }

  // Required: amount (always include, default to 0 if invalid)
  const rawAmount =
    typeof data.amount === 'number' ? data.amount : parseFloat(String(data.amount ?? '0'))
  cleaned.amount = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) / 100 : 0

  // Optional: order_id — only include if it's a non-empty string
  if (typeof data.order_id === 'string' && data.order_id.trim() !== '') {
    cleaned.order_id = data.order_id.trim()
  }

  // Optional: venda_avulsa_id — only include if it's a non-empty string
  if (typeof data.venda_avulsa_id === 'string' && data.venda_avulsa_id.trim() !== '') {
    cleaned.venda_avulsa_id = data.venda_avulsa_id.trim()
  }

  // Card-specific fields — only include for card payments
  if (isCardPayment) {
    if (typeof data.card_flag === 'string' && data.card_flag.trim() !== '') {
      cleaned.card_flag = data.card_flag.trim()
    }

    const rawInst =
      typeof data.installments === 'number'
        ? data.installments
        : parseInt(String(data.installments ?? '1'), 10)
    cleaned.installments = Number.isFinite(rawInst) && rawInst > 0 ? rawInst : 1

    const rawRate =
      typeof data.applied_rate === 'number'
        ? data.applied_rate
        : parseFloat(String(data.applied_rate ?? '0'))
    cleaned.applied_rate = Number.isFinite(rawRate) ? Math.round(rawRate * 10000) / 10000 : 0

    const rawFee =
      typeof data.fee_amount === 'number'
        ? data.fee_amount
        : parseFloat(String(data.fee_amount ?? '0'))
    cleaned.fee_amount = Number.isFinite(rawFee) ? Math.round(rawFee * 100) / 100 : 0
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
          `  sanitizedData: ${JSON.stringify(cleaned, null, 2)}\n` +
          `  originalData: ${JSON.stringify(data, null, 2)}`,
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
