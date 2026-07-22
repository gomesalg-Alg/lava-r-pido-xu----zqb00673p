import pb from '@/lib/pocketbase/client'

export type CardFlag = 'Visa' | 'Mastercard' | 'Elo'

export type CardRate = {
  id: string
  flag: CardFlag
  debit_rate: number
  credit_1x_rate: number
  credit_2x_rate: number
  credit_3x_rate: number
  credit_4x_rate: number
  is_active: boolean
  created: string
  updated: string
}

export const getCardRates = () =>
  pb.collection('card_rates').getFullList<CardRate>({ sort: 'flag' })

export const getCardRate = (id: string) => pb.collection('card_rates').getOne<CardRate>(id)

export const updateCardRate = (id: string, data: Record<string, unknown>) =>
  pb.collection('card_rates').update<CardRate>(id, data)

export const getRateForPayment = (
  rates: CardRate[],
  flag: CardFlag,
  method: string,
  installments: number,
): number => {
  const rate = rates.find((r) => r.flag === flag && r.is_active)
  if (!rate) return 0
  if (method === 'Cartão de Débito') return rate.debit_rate
  if (method === 'Cartão de Crédito') {
    const map: Record<number, number> = {
      1: rate.credit_1x_rate,
      2: rate.credit_2x_rate,
      3: rate.credit_3x_rate,
      4: rate.credit_4x_rate,
    }
    return map[installments] ?? rate.credit_1x_rate
  }
  return 0
}
