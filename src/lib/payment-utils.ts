export interface PaymentSummaryLine {
  id?: string
  method: string
  amount: number
  card_flag?: string
  installments?: number
}

export interface ConsolidatedPayments {
  payments: PaymentSummaryLine[]
  totalPaid: number
  troco: number
}

/**
 * Consolidates and deduplicates payment records for receipts (both Service Orders and Miscellaneous Sales).
 * Resolves issues where identical payment records are stored or fetched repeatedly.
 */
export function consolidatePayments(params: {
  rawPayments: any[]
  orderTotal: number
  fallbackMethod?: string
  changeAmount?: number
}): ConsolidatedPayments {
  const { rawPayments, orderTotal, fallbackMethod = '', changeAmount = 0 } = params

  const parsedPayments: PaymentSummaryLine[] = (rawPayments || [])
    .map((p) => ({
      id: p.id,
      method: p.method || '',
      amount: typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || 0),
      card_flag: p.card_flag || '',
      installments: p.installments || 1,
    }))
    .filter((p) => p.amount > 0 || p.method !== '')

  const rawSum = parsedPayments.reduce((s, p) => s + (p.amount || 0), 0)
  let finalPayments: PaymentSummaryLine[] = []

  if (parsedPayments.length > 0) {
    if (rawSum > orderTotal + 0.01) {
      // Deduplicate identical copies caused by loop insertions
      const uniqueMap = new Map<string, PaymentSummaryLine>()
      for (const item of parsedPayments) {
        const sig = `${item.method}_${(item.amount || 0).toFixed(2)}_${item.card_flag || ''}_${item.installments || 1}`
        if (!uniqueMap.has(sig)) {
          uniqueMap.set(sig, item)
        }
      }
      const dedupedList = Array.from(uniqueMap.values())
      const dedupedSum = dedupedList.reduce((s, p) => s + (p.amount || 0), 0)

      if (
        Math.abs(dedupedSum - orderTotal) < 0.01 ||
        Math.abs(dedupedSum - (orderTotal + changeAmount)) < 0.01 ||
        (dedupedSum >= orderTotal && rawSum > dedupedSum)
      ) {
        finalPayments = dedupedList
      } else {
        finalPayments = parsedPayments
      }
    } else {
      finalPayments = parsedPayments
    }
  }

  if (finalPayments.length === 0 && fallbackMethod) {
    finalPayments = [
      {
        method: fallbackMethod,
        amount: orderTotal,
      },
    ]
  }

  const calculatedTotalPaid = finalPayments.reduce((s, p) => s + (p.amount || 0), 0)
  const totalPaid =
    calculatedTotalPaid > 0
      ? calculatedTotalPaid
      : orderTotal + (changeAmount > 0 ? changeAmount : 0)
  const calculatedTroco = totalPaid > orderTotal ? totalPaid - orderTotal : 0
  const troco = calculatedTroco > 0 ? calculatedTroco : changeAmount > 0 ? changeAmount : 0

  return {
    payments: finalPayments,
    totalPaid,
    troco,
  }
}
